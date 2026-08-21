<?php

namespace App\Services;

use GeoIp2\Database\Reader;
use GeoIp2\Exception\AddressNotFoundException;
use Illuminate\Support\Facades\Log;

/**
 * Resolve negara pengunjung dari IP, untuk nentuin currency & harga regional yang ditampilkan.
 *
 * Memakai database lokal MaxMind GeoLite2 (file .mmdb), bukan API pihak ketiga:
 * IP pengunjung tidak pernah keluar dari server, tidak ada rate limit, dan tidak ada
 * layanan eksternal yang bisa down. Konsekuensinya file databasenya harus ada di tiap
 * server dan di-update berkala — lihat `php artisan geoip:status`.
 *
 * PENTING soal IP di belakang proxy: service ini pakai $request->ip(). Kalau VPS
 * nanti dipasang Cloudflare / reverse proxy, IP yang kebaca adalah IP proxy, bukan
 * pengunjung — perlu set trustProxies() di bootstrap/app.php supaya X-Forwarded-For dipakai.
 */
class GeoLocationService
{
    private ?Reader $reader = null;
    private bool $readerFailed = false;

    /** Memo per-request: resolve() bisa dipanggil beberapa kali dalam satu request. */
    private array $memo = [];

    /**
     * Kode negara ISO-2 dari IP, atau null kalau tidak bisa ditentukan.
     * Null berarti "tidak tahu", bukan "bukan negara yang didukung" —
     * pemanggil yang memutuskan mau fallback ke mana.
     */
    public function countryFromIp(?string $ip): ?string
    {
        // IP lokal/private tidak ada di database GeoIP manapun (dev di 127.0.0.1).
        // Pakai mock dari .env supaya storefront lokal bisa dites seolah dari AU/IN/PH.
        if ($ip === null || $this->isPrivateIp($ip)) {
            $mock = strtoupper((string) env('GEO_MOCK_COUNTRY', ''));

            return $mock !== '' ? $mock : null;
        }

        if (array_key_exists($ip, $this->memo)) {
            return $this->memo[$ip];
        }

        return $this->memo[$ip] = $this->lookup($ip);
    }

    private function lookup(string $ip): ?string
    {
        $reader = $this->reader();
        if ($reader === null) {
            return null;
        }

        try {
            $code = $reader->country($ip)->country->isoCode;

            return $code !== null ? strtoupper($code) : null;
        } catch (AddressNotFoundException) {
            // IP sah tapi tidak ada di database — hal biasa, bukan error.
            return null;
        } catch (\Throwable $e) {
            Log::warning('GeoLite2 lookup failed', ['ip' => $ip, 'error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Reader dibuka sekali per request, dan cuma kalau memang ada IP publik yang
     * perlu dicari. Kegagalan diingat supaya tidak mencoba (dan nge-log) berulang kali.
     */
    private function reader(): ?Reader
    {
        if ($this->reader !== null || $this->readerFailed) {
            return $this->reader;
        }

        $path = (string) config('services.maxmind.database_path');

        if ($path === '' || ! is_file($path)) {
            // Server tanpa database GeoLite2 tetap harus melayani storefront —
            // deteksi negara dilewati, semua pengunjung jatuh ke region default.
            $this->readerFailed = true;

            return null;
        }

        try {
            return $this->reader = new Reader($path);
        } catch (\Throwable $e) {
            Log::warning('GeoLite2 database unreadable', ['path' => $path, 'error' => $e->getMessage()]);
            $this->readerFailed = true;

            return null;
        }
    }

    /**
     * Negara + currency + locale yang harus dipakai untuk pengunjung ini.
     * `supported` menandai apakah negaranya benar-benar terdeteksi & dilokalkan —
     * frontend pakai flag ini untuk memutuskan perlu munculin popup region atau tidak.
     */
    public function resolve(?string $ip): array
    {
        $detected = $this->countryFromIp($ip);
        $countries = config('regions.countries', []);
        $isSupported = $detected !== null && isset($countries[$detected]);
        $code = $isSupported ? $detected : config('regions.fallback_country', 'ID');
        $region = $countries[$code] ?? ['name' => $code, 'currency' => 'IDR', 'locale' => 'id-ID'];

        return [
            'country_code' => $code,
            'country_name' => $region['name'],
            'currency' => $region['currency'],
            'locale' => $region['locale'],
            'detected_country' => $detected,
            'supported' => $isSupported,
        ];
    }

    /** Dipakai `geoip:status` untuk melaporkan kondisi database ke operator. */
    public function databaseInfo(): array
    {
        $path = (string) config('services.maxmind.database_path');

        if ($path === '' || ! is_file($path)) {
            return ['available' => false, 'path' => $path];
        }

        try {
            $metadata = (new Reader($path))->metadata();

            return [
                'available' => true,
                'path' => $path,
                'built_at' => \Carbon\CarbonImmutable::createFromTimestamp($metadata->buildEpoch),
                'type' => $metadata->databaseType,
            ];
        } catch (\Throwable $e) {
            return ['available' => false, 'path' => $path, 'error' => $e->getMessage()];
        }
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
}
