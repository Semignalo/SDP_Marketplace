<?php

namespace App\Console\Commands;

use App\Services\GeoLocationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Database GeoLite2 tidak ikut di-commit, jadi gampang terlupa saat setup server baru —
 * dan kalau hilang, deteksi negara mati diam-diam tanpa error yang kelihatan.
 * Command ini bikin kondisinya bisa dicek sekali jalan saat deploy.
 */
#[Signature('geoip:status {--ip= : Uji lookup satu IP publik}')]
#[Description('Cek keberadaan & umur database GeoLite2, plus uji lookup IP.')]
class GeoipStatus extends Command
{
    public function handle(GeoLocationService $geo): int
    {
        $info = $geo->databaseInfo();

        if (! ($info['available'] ?? false)) {
            $this->error('Database GeoLite2 TIDAK ditemukan.');
            $this->line('  Path  : ' . ($info['path'] ?: '(belum diset)'));
            if (isset($info['error'])) {
                $this->line('  Error : ' . $info['error']);
            }
            $this->newLine();
            $this->warn('Storefront tetap jalan, tapi semua pengunjung dianggap dari region default.');
            $this->line('Unduh GeoLite2-Country.mmdb dari akun MaxMind, taruh di path di atas.');

            return self::FAILURE;
        }

        $builtAt = $info['built_at'];
        $ageDays = (int) $builtAt->diffInDays(now());
        $staleAfter = (int) config('services.maxmind.stale_after_days', 60);

        $this->info('Database GeoLite2 ditemukan.');
        $this->line('  Path     : ' . $info['path']);
        $this->line('  Tipe     : ' . $info['type']);
        $this->line('  Dibangun : ' . $builtAt->toDateString() . " ({$ageDays} hari lalu)");

        if ($ageDays > $staleAfter) {
            $this->newLine();
            $this->warn("Database sudah lebih tua dari {$staleAfter} hari — akurasinya menurun seiring blok IP berpindah pemilik.");
            $this->line('Jalankan geoipupdate, atau unduh ulang file-nya.');
        }

        if ($ip = $this->option('ip')) {
            $this->newLine();
            $result = $geo->resolve($ip);
            $this->line("Lookup {$ip}:");
            $this->line('  Terdeteksi : ' . ($result['detected_country'] ?? '(tidak ketemu)'));
            $this->line('  Dipakai    : ' . $result['country_code'] . ' / ' . $result['currency']
                . ($result['supported'] ? '' : ' (fallback — negara belum dilokalkan)'));
        }

        return self::SUCCESS;
    }
}
