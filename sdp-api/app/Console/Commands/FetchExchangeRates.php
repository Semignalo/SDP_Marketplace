<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('rates:fetch')]
#[Description('Tarik kurs terbaru IDR ke mata uang lokal (AUD, INR, PHP, USD) untuk tampilan harga storefront.')]
class FetchExchangeRates extends Command
{
    public function handle(ExchangeRateService $rates): int
    {
        $updated = $rates->refresh();

        if ($updated === 0) {
            // Bukan failure fatal — kurs lama masih dipakai, tapi perlu kelihatan di log scheduler.
            $this->warn('Tidak ada kurs yang ter-update. Cek log untuk detail.');

            return self::FAILURE;
        }

        $this->info("Kurs ter-update: {$updated} mata uang.");

        return self::SUCCESS;
    }
}
