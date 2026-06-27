<?php

namespace App\Services;

use App\Models\Order;
use Midtrans\Config;
use Midtrans\Notification;
use Midtrans\Snap;
use Midtrans\Transaction;
use RuntimeException;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = (bool) config('midtrans.is_sanitized', true);
        Config::$is3ds = (bool) config('midtrans.is_3ds', true);

        // Workaround SSL cert untuk Windows/Laragon dev — JANGAN dipakai di production.
        // HTTPHEADER harus diinit kosong karena SDK akses langsung tanpa isset().
        if (app()->environment('local')) {
            Config::$curlOptions = [
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_HTTPHEADER => [],
            ];
        }
    }

    public function isConfigured(): bool
    {
        return ! empty(config('midtrans.server_key')) && ! empty(config('midtrans.client_key'));
    }

    public function getSnapToken(Order $order): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Midtrans is not configured. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env');
        }

        $order->loadMissing(['items', 'customer']);

        $itemDetails = $order->items->map(fn ($item) => [
            'id' => 'P-' . $item->product_id,
            'price' => (int) round($item->price),
            'quantity' => (int) $item->quantity,
            'name' => mb_substr($item->product_name, 0, 50),
        ])->all();

        if ((float) $order->shipping_cost > 0) {
            $itemDetails[] = [
                'id' => 'SHIPPING',
                'price' => (int) round($order->shipping_cost),
                'quantity' => 1,
                'name' => 'Shipping ' . ($order->shipping_courier ?? 'Courier'),
            ];
        }

        // Sanity check: gross_amount harus sama dengan SUM(item.price * qty)
        $grossAmount = (int) round($order->total);

        $payload = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => $grossAmount,
            ],
            'item_details' => $itemDetails,
            'customer_details' => [
                'first_name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'email' => $order->customer?->email ?? $order->guest_email,
                'shipping_address' => [
                    'first_name' => $order->shipping_name,
                    'phone' => $order->shipping_phone,
                    'address' => $order->shipping_address,
                ],
            ],
        ];

        try {
            return Snap::getSnapToken($payload);
        } catch (\Exception $e) {
            if (! $this->isOrderIdTakenError($e->getMessage())) {
                throw $e;
            }

            // Order ID already has an open transaction at Midtrans (e.g. customer closed
            // Snap without paying) — free it up, then retry once.
            try {
                Transaction::cancel($order->order_number);
            } catch (\Exception) {
                try {
                    Transaction::expire($order->order_number);
                } catch (\Exception) {
                    // Couldn't free up the order ID — let the retry below decide the final outcome.
                }
            }

            try {
                return Snap::getSnapToken($payload);
            } catch (\Exception $retryException) {
                if ($this->isOrderIdTakenError($retryException->getMessage())) {
                    throw new RuntimeException(
                        "We couldn't restart this payment automatically. Please refresh the page and try again in a moment."
                    );
                }
                throw $retryException;
            }
        }
    }

    private function isOrderIdTakenError(string $message): bool
    {
        return str_contains($message, 'order_id') && str_contains($message, '400');
    }

    /**
     * Cek status transaksi langsung ke Midtrans API (untuk fallback saat webhook tidak masuk).
     * Returns next_status sama seperti resolveNotification.
     */
    public function checkTransactionStatus(string $orderNumber): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Midtrans is not configured');
        }

        $status = Transaction::status($orderNumber);

        $transactionStatus = $status->transaction_status ?? null;
        $fraudStatus = $status->fraud_status ?? null;

        $next = null;
        if ($transactionStatus === 'capture') {
            $next = $fraudStatus === 'accept' ? 'processing' : null;
        } elseif ($transactionStatus === 'settlement') {
            $next = 'processing';
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $next = 'cancelled';
        }

        return [
            'transaction_status' => $transactionStatus,
            'fraud_status' => $fraudStatus,
            'next_status' => $next,
            'transaction_id' => $status->transaction_id ?? null,
            'payment_type' => $status->payment_type ?? null,
            'payment_channel' => $status->va_numbers[0]->bank ?? $status->payment_type ?? null,
            'gross_amount' => isset($status->gross_amount) ? (float) $status->gross_amount : null,
        ];
    }

    /**
     * Resolve a webhook notification → returns ['order_number' => ..., 'next_status' => 'processing'|'cancelled'|null]
     * next_status is null when no status change required.
     */
    public function resolveNotification(): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Midtrans is not configured');
        }

        $notif = new Notification();

        $orderId = $notif->order_id;
        $transactionStatus = $notif->transaction_status;
        $fraudStatus = $notif->fraud_status ?? null;

        // Mapping reference: https://docs.midtrans.com/reference/webhook-https-notification
        $next = null;
        if ($transactionStatus === 'capture') {
            $next = $fraudStatus === 'accept' ? 'processing' : null;
        } elseif ($transactionStatus === 'settlement') {
            $next = 'processing';
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $next = 'cancelled';
        }

        return [
            'order_number' => $orderId,
            'transaction_status' => $transactionStatus,
            'fraud_status' => $fraudStatus,
            'next_status' => $next,
            'transaction_id' => $notif->transaction_id ?? null,
            'payment_type' => $notif->payment_type ?? null,
            'payment_channel' => $notif->va_numbers[0]->bank ?? $notif->payment_type ?? null,
            'gross_amount' => isset($notif->gross_amount) ? (float) $notif->gross_amount : null,
        ];
    }
}
