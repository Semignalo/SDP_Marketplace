<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Product;
use App\Models\ResellerCommission;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('orders:cancel-expired')]
#[Description("Batalkan pesanan pending_payment yang SUDAH DI-QUOTE ongkirnya (quoted_at terisi) tapi belum dibayar lebih dari 30 hari, restore stok, dan batalkan komisi terkait. Order yang belum pernah di-quote (checkout domestik biasa) TIDAK PERNAH di-auto-cancel oleh command ini.")]
class CancelExpiredOrders extends Command
{
    private const QUOTED_ORDER_GRACE_DAYS = 30;

    public function handle(): int
    {
        $orders = Order::where('status', 'pending_payment')
            ->whereNotNull('quoted_at')
            ->where('quoted_at', '<', now()->subDays(self::QUOTED_ORDER_GRACE_DAYS))
            ->with('items')
            ->get();

        foreach ($orders as $order) {
            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }

                ResellerCommission::where('order_id', $order->id)
                    ->whereIn('status', ['pending', 'earned'])
                    ->update(['status' => 'cancelled']);

                $order->update([
                    'status' => 'cancelled',
                    'admin_notes' => 'Automatically cancelled — no payment received within '.self::QUOTED_ORDER_GRACE_DAYS.' days of shipping quote.',
                ]);
            });
        }

        $this->info("Dibatalkan otomatis: {$orders->count()} pesanan.");

        return self::SUCCESS;
    }
}
