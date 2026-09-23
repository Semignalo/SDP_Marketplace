<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\MetaCapiService;

class OrderObserver
{
    /**
     * Order baru saja jadi `processing` (= terbayar) → kirim Purchase ke Meta CAPI.
     *
     * Satu titik ini mencakup semua jalur pembayaran: webhook Midtrans, check-status
     * (logged-in & guest), dan admin menandai lunas manual (bayar di luar Midtrans).
     * Pengiriman ditunda sampai response terkirim, supaya webhook/polling tidak menunggu Meta.
     */
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status') || $order->status !== 'processing') {
            return;
        }

        if ($order->capi_purchase_sent_at !== null) {
            return;
        }

        $orderId = $order->id;

        app()->terminating(function () use ($orderId) {
            $fresh = Order::find($orderId);

            if ($fresh && $fresh->status === 'processing') {
                app(MetaCapiService::class)->sendPurchase($fresh);
            }
        });
    }
}
