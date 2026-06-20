<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\ResellerCommission;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('orders:complete-shipped')]
#[Description('Tandai pesanan shipped lebih dari 7 hari sebagai completed, dan jadikan komisi terkait earned.')]
class CompleteShippedOrders extends Command
{
    public function handle(): int
    {
        $orders = Order::where('status', 'shipped')
            ->where('updated_at', '<', now()->subDays(7))
            ->get();

        foreach ($orders as $order) {
            DB::transaction(function () use ($order) {
                $order->update(['status' => 'completed']);

                ResellerCommission::where('order_id', $order->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'earned']);
            });
        }

        $this->info("Diselesaikan otomatis: {$orders->count()} pesanan.");

        return self::SUCCESS;
    }
}
