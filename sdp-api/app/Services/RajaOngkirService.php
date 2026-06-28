<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirService
{
    private string $apiKey;
    private string $baseUrl = 'https://rajaongkir.komerce.id/api/v1';

    // Kurir yang akan dicek (semua yang didukung Komerce)
    private array $couriers = ['jne', 'jnt', 'sicepat', 'pos', 'anteraja', 'tiki'];

    public function __construct()
    {
        $this->apiKey = config('services.rajaongkir.api_key', '');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Cari destinasi mentah dari Komerce API, di-cache 1 jam.
     * Return: [{id, name (label lengkap), province, city}]
     */
    private function rawSearch(string $search, int $limit = 20): array
    {
        if (empty($search)) {
            return [];
        }

        $cacheKey = 'rajaongkir_dest_' . md5($search . '|' . $limit);

        return Cache::remember($cacheKey, 3600, function () use ($search, $limit) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['key' => $this->apiKey])
                    ->get("{$this->baseUrl}/destination/domestic-destination", [
                        'search' => $search,
                        'limit'  => $limit,
                        'offset' => 0,
                    ]);

                if (! $response->successful()) {
                    Log::warning('RajaOngkir rawSearch failed', ['status' => $response->status()]);
                    return [];
                }

                $results = $response->json('data', []);
                if (! is_array($results)) {
                    return [];
                }

                return collect($results)->map(fn ($d) => [
                    'id'       => (int) ($d['id'] ?? 0),
                    'name'     => $d['label'] ?? '',
                    'province' => $d['province_name'] ?? '',
                    'city'     => $d['city_name'] ?? '',
                ])->filter(fn ($d) => $d['id'] > 0)->values()->all();

            } catch (\Throwable $e) {
                Log::warning('RajaOngkir rawSearch exception', ['error' => $e->getMessage()]);
                return [];
            }
        });
    }

    /**
     * Langkah 1: cari kota/kabupaten saja (di-dedupe per nama kota), kota yang
     * cocok dengan kata kunci naik ke atas. Tidak ada ID di sini — ID baru
     * didapat di searchDistricts() setelah user pilih kota.
     * Return: [{city, province}]
     */
    public function searchCities(string $search = ''): array
    {
        $needle = strtolower(trim($search));
        $results = $this->rawSearch($search, 50);

        return collect($results)
            ->map(fn ($d) => [
                'city'           => $d['city'],
                'province'       => $d['province'],
                'is_city'        => strtolower($d['city']) === $needle,
                'city_starts_with' => str_starts_with(strtolower($d['city']), $needle),
            ])
            ->unique(fn ($d) => strtolower($d['city']))
            ->sortByDesc(fn ($d) => ($d['is_city'] ? 2 : 0) + ($d['city_starts_with'] ? 1 : 0))
            ->map(fn ($d) => ['city' => $d['city'], 'province' => $d['province']])
            ->values()
            ->all();
    }

    /**
     * Langkah 2: cari kecamatan/kelurahan di dalam kota yang sudah dipilih.
     * $search opsional untuk menyaring lebih lanjut (nama kecamatan).
     * Return: [{id, name (kecamatan/kelurahan saja), province, city}]
     */
    public function searchDistricts(string $city, string $search = ''): array
    {
        $city = trim($city);
        if ($city === '') {
            return [];
        }

        $results = $this->rawSearch($search !== '' ? $search : $city, 100);

        return collect($results)
            ->filter(fn ($d) => strcasecmp($d['city'], $city) === 0)
            ->map(function ($d) {
                $parts = array_map('trim', explode(',', $d['name']));
                $cityIdx = null;
                foreach ($parts as $i => $part) {
                    if (strcasecmp($part, $d['city']) === 0) {
                        $cityIdx = $i;
                        break;
                    }
                }

                $district = $cityIdx !== null
                    ? implode(', ', array_slice($parts, 0, $cityIdx))
                    : $d['name'];

                return [
                    'id'       => $d['id'],
                    'name'     => $district !== '' ? $district : $d['name'],
                    'province' => $d['province'],
                    'city'     => $d['city'],
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }

    /**
     * Cari destination_id terbaik untuk teks kota legacy (tanpa kecamatan) + postal code opsional.
     * Dipakai untuk backfill data lama yang cuma punya nama kota, bukan hasil pilihan user via search box.
     *
     * Strategi: cari kandidat kecamatan dalam kota yang cocok, lalu kalau ada yang zip-nya sama
     * dengan $postalCode itu match 'exact'. Kalau tidak, ambil kandidat pertama sebagai 'approximate'.
     *
     * @return array{id:int, confidence:string}|null
     */
    public function findDestinationId(string $cityText, ?string $postalCode = null): ?array
    {
        $needle = $this->normalizeCityName($cityText);
        if ($needle === '') {
            return null;
        }

        $results = $this->rawSearch($cityText, 100);

        $candidates = collect($results)->filter(
            fn ($d) => $this->normalizeCityName($d['city']) === $needle
        )->values();

        if ($candidates->isEmpty()) {
            return null;
        }

        if ($postalCode) {
            $exact = $candidates->first(fn ($d) => str_ends_with(trim($d['name']), $postalCode));
            if ($exact) {
                return ['id' => $exact['id'], 'confidence' => 'exact'];
            }
        }

        return ['id' => $candidates->first()['id'], 'confidence' => 'approximate'];
    }

    private function normalizeCityName(string $city): string
    {
        $city = strtoupper(trim($city));
        $city = preg_replace('/^KOTA\s+ADM\.?\s+/', '', $city);
        $city = preg_replace('/^(KOTA|KABUPATEN|KAB\.)\s+/', '', $city);

        return trim($city);
    }

    /**
     * Hitung ongkos kirim via Komerce/RajaOngkir API.
     * Otomatis loop semua kurir yang didukung.
     *
     * @return array [{code, name, service, description, cost, eta}]
     */
    public function getCost(int $origin, int $destination, int $weightGram): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $weightGram = max(1, $weightGram);
        $allRates   = [];

        foreach ($this->couriers as $courier) {
            try {
                $response = Http::timeout(15)
                    ->withHeaders([
                        'key'          => $this->apiKey,
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ])
                    ->asForm()
                    ->post("{$this->baseUrl}/calculate/domestic-cost", [
                        'origin'      => $origin,
                        'destination' => $destination,
                        'weight'      => $weightGram,
                        'courier'     => $courier,
                        'price'       => 'lowest',
                    ]);

                if (! $response->successful()) {
                    continue;
                }

                $results = $response->json('data', []);

                foreach ($results as $item) {
                    $allRates[] = [
                        'code'    => strtolower($item['code'] ?? $courier) . '_' . strtolower($item['service'] ?? ''),
                        'name'    => $item['name'] ?? strtoupper($courier),
                        'service' => $item['service'] ?? '',
                        'cost'    => (int) ($item['cost'] ?? 0),
                        'eta'     => isset($item['etd']) ? $item['etd'] . ' hari' : '-',
                    ];
                }

            } catch (\Throwable $e) {
                Log::warning('RajaOngkir getCost exception', ['courier' => $courier, 'error' => $e->getMessage()]);
            }
        }

        // Urutkan dari termurah
        usort($allRates, fn ($a, $b) => $a['cost'] <=> $b['cost']);

        return $allRates;
    }

    /**
     * Hardcoded fallback rates jika API tidak tersedia / belum dikonfigurasi.
     */
    public static function fallbackRates(): array
    {
        return [
            ['code' => 'jne_reg',     'name' => 'JNE',      'service' => 'REG',    'cost' => 18000, 'eta' => '2-3 hari'],
            ['code' => 'jne_yes',     'name' => 'JNE',      'service' => 'YES',    'cost' => 28000, 'eta' => '1 hari'],
            ['code' => 'jnt_ez',      'name' => 'J&T',      'service' => 'EZ',     'cost' => 16000, 'eta' => '2-3 hari'],
            ['code' => 'sicepat_reg', 'name' => 'SiCepat',  'service' => 'REG',    'cost' => 15000, 'eta' => '2-3 hari'],
            ['code' => 'anteraja',    'name' => 'AnterAja', 'service' => 'REG',    'cost' => 14000, 'eta' => '2-4 hari'],
            ['code' => 'pos_kilat',   'name' => 'POS',      'service' => 'Kilat',  'cost' => 12000, 'eta' => '3-5 hari'],
        ];
    }
}
