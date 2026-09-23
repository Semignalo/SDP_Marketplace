<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\MetaCapiService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('meta:capi-resend')]
#[Description('Kirim ulang Purchase ke Meta CAPI untuk order terbayar yang belum terkirim (maks 7 hari terakhir).')]
class ResendMetaPurchases extends Command
{
    public function handle(MetaCapiService $capi): int
    {
        if (! $capi->isConfigured()) {
            $this->warn('Meta CAPI belum dikonfigurasi (Pixel ID di Admin Settings + META_CAPI_ACCESS_TOKEN di .env).');

            return self::SUCCESS;
        }

        // Meta menolak event yang lebih tua dari 7 hari.
        $orders = Order::whereIn('status', ['processing', 'shipped', 'completed'])
            ->whereNull('capi_purchase_sent_at')
            ->where('payment_verified_at', '>=', now()->subDays(7))
            ->get();

        $sent = 0;
        foreach ($orders as $order) {
            if ($capi->sendPurchase($order)) {
                $sent++;
            }
        }

        $this->info("Purchase terkirim: {$sent} dari {$orders->count()} order.");

        return self::SUCCESS;
    }
}
