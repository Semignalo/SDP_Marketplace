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
#[Description('Batalkan pesanan pending_payment yang sudah lebih dari 24 jam, restore stok, dan batalkan komisi terkait.')]
class CancelExpiredOrders extends Command
{
    public function handle(): int
    {
        $orders = Order::where('status', 'pending_payment')
            ->where('created_at', '<', now()->subHours(24))
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

                $order->update(['status' => 'cancelled', 'admin_notes' => 'Automatically cancelled — no payment received within 24 hours.']);
            });
        }

        $this->info("Dibatalkan otomatis: {$orders->count()} pesanan.");

        return self::SUCCESS;
    }
}
