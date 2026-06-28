<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Services\RajaOngkirService;
use Illuminate\Console\Command;

class BackfillAddressCityIds extends Command
{
    protected $signature = 'app:backfill-address-city-ids {--dry-run}';

    protected $description = 'Cocokkan address legacy yang city_id-nya kosong ke destination_id RajaOngkir, berdasarkan teks kota + kode pos.';

    public function handle(RajaOngkirService $rajaOngkir): int
    {
        if (! $rajaOngkir->isConfigured()) {
            $this->error('RajaOngkir API key belum dikonfigurasi.');
            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $addresses = Address::whereNull('city_id')->get();

        $this->info("Memproses {$addresses->count()} address...");

        $exact = 0;
        $approximate = 0;
        $unmatched = [];

        foreach ($addresses as $address) {
            $match = $rajaOngkir->findDestinationId($address->city, $address->postal_code);

            if (! $match) {
                $unmatched[] = $address;
                $this->warn("  #{$address->id} [{$address->city}] — tidak ditemukan");
                continue;
            }

            $confidence = $match['confidence'];
            $confidence === 'exact' ? $exact++ : $approximate++;

            $this->line("  #{$address->id} [{$address->city}, {$address->postal_code}] → destination_id {$match['id']} ({$confidence})");

            if (! $dryRun) {
                $address->update(['city_id' => $match['id']]);
            }
        }

        $this->newLine();
        $this->info("Exact match (cocok kode pos): {$exact}");
        $this->info("Approximate match (cuma cocok nama kota): {$approximate}");
        $this->info('Tidak ditemukan: ' . count($unmatched));

        if ($dryRun) {
            $this->comment('Dry run — tidak ada data yang diubah. Jalankan tanpa --dry-run untuk menyimpan.');
        }

        return self::SUCCESS;
    }
}
