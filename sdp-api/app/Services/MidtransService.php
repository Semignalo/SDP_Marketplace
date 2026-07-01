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

        // Midtrans requires gross_amount == SUM(item_details). If there's a tier
        // discount, we add a negative line item so the totals reconcile.
        $grossAmount = (int) round($order->total);
        $itemSum = array_sum(array_map(fn ($i) => $i['price'] * $i['quantity'], $itemDetails));
        $discountDiff = $itemSum - $grossAmount;
        if ($discountDiff > 0) {
            $itemDetails[] = [
                'id' => 'DISCOUNT',
                'price' => -$discountDiff,
                'quantity' => 1,
                'name' => 'Loyalty Discount',
            ];
        }

        $buildPayload = fn (string $midtransOrderId) => [
            'transaction_details' => [
                'order_id' => $midtransOrderId,
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

        // Reuse the last Midtrans order_id we issued for this order, if any —
        // otherwise this is the first attempt, so use the plain order number.
        $midtransOrderId = $order->midtrans_order_id ?: $order->order_number;

        try {
            $token = Snap::getSnapToken($buildPayload($midtransOrderId));
            if ($order->midtrans_order_id !== $midtransOrderId) {
                $order->update(['midtrans_order_id' => $midtransOrderId]);
            }
            return $token;
        } catch (\Exception $e) {
            if (! $this->isOrderIdTakenError($e->getMessage())) {
                throw $e;
            }

            // That Midtrans order_id already has an open transaction (e.g. the customer
            // closed Snap without paying earlier). Rather than fight over the same ID,
            // mint a brand new one for this attempt — guaranteed to be unused.
            $attempt = 2;
            if (preg_match('/-r(\d+)$/', (string) $order->midtrans_order_id, $m)) {
                $attempt = ((int) $m[1]) + 1;
            }
            $nextOrderId = "{$order->order_number}-r{$attempt}";

            try {
                $token = Snap::getSnapToken($buildPayload($nextOrderId));
                $order->update(['midtrans_order_id' => $nextOrderId]);
                return $token;
            } catch (\Exception $retryException) {
                throw new RuntimeException(
                    "We couldn't restart this payment automatically. Please refresh the page and try again in a moment."
                );
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
    public function checkTransactionStatus(Order $order): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Midtrans is not configured');
        }

        $status = Transaction::status($order->midtrans_order_id ?: $order->order_number);

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
