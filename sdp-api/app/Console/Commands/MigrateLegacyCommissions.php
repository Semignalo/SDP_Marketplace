<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\ResellerCommission;
use App\Models\Setting;
use Illuminate\Console\Command;

class MigrateLegacyCommissions extends Command
{
    protected $signature = 'legacy:migrate-commissions';

    protected $description = 'Generate komisi reseller untuk order hasil migrasi legacy yang punya reseller_id, pakai rate global sekarang';

    public function handle(): int
    {
        $rate = (float) Setting::get('reseller_commission_rate', 10);

        $orders = Order::whereNotNull('reseller_id')->get();

        $created = 0;
        $updated = 0;

        foreach ($orders as $order) {
            $status = match ($order->status) {
                'completed' => 'earned',
                'cancelled' => 'cancelled',
                default => 'pending',
            };

            $commission = ResellerCommission::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'reseller_id' => $order->reseller_id,
                    'customer_id' => $order->user_id,
                    'order_total' => $order->subtotal,
                    'rate' => $rate,
                    'amount' => round($order->subtotal * $rate / 100, 2),
                    'status' => $status,
                ]
            );

            $commission->wasRecentlyCreated ? $created++ : $updated++;
        }

        $this->info("Selesai. {$created} komisi dibuat baru, {$updated} di-update. Rate dipakai: {$rate}%.");

        return self::SUCCESS;
    }
}
