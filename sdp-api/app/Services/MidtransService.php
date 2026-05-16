<?php

namespace App\Services;

use App\Models\Order;
use Midtrans\Config;
use Midtrans\Notification;
use Midtrans\Snap;
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
            throw new RuntimeException('Midtrans belum dikonfigurasi. Set MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env');
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
                'name' => 'Ongkir ' . ($order->shipping_courier ?? 'Kurir'),
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
                'email' => $order->customer?->email,
                'shipping_address' => [
                    'first_name' => $order->shipping_name,
                    'phone' => $order->shipping_phone,
                    'address' => $order->shipping_address,
                ],
            ],
        ];

        return Snap::getSnapToken($payload);
    }

    /**
     * Resolve a webhook notification → returns ['order_number' => ..., 'next_status' => 'processing'|'cancelled'|null]
     * next_status is null when no status change required.
     */
    public function resolveNotification(): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Midtrans belum dikonfigurasi');
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
        ];
    }
}
