<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\Setting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('orders:cancel-expired')]
#[Description('Batalkan pesanan pending_payment yang sudah lebih dari N jam (setting order_auto_cancel_hours), restore stok, dan batalkan komisi terkait.')]
class CancelExpiredOrders extends Command
{
    public function handle(): int
    {
        $hours = (int) Setting::get('order_auto_cancel_hours', 24);

        $orders = Order::where('status', 'pending_payment')
            ->where('created_at', '<', now()->subHours($hours))
            ->with('items')
            ->get();

        foreach ($orders as $order) {
            DB::transaction(function () use ($order, $hours) {
                foreach ($order->items as $item) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }

                ResellerCommission::where('order_id', $order->id)
                    ->whereIn('status', ['pending', 'earned'])
                    ->update(['status' => 'cancelled']);

                $order->update(['status' => 'cancelled', 'admin_notes' => "Automatically cancelled — no payment received within {$hours} hours."]);
            });
        }

        $this->info("Dibatalkan otomatis: {$orders->count()} pesanan.");

        return self::SUCCESS;
    }
}
