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
     * Cari destinasi/kota dari Komerce API, di-cache 24 jam.
     * Return: [{id, name, province, type}]
     */
    public function searchDestinations(string $search = ''): array
    {
        if (empty($search)) {
            return [];
        }

        $cacheKey = 'rajaongkir_dest_' . md5($search);

        return Cache::remember($cacheKey, 3600, function () use ($search) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['key' => $this->apiKey])
                    ->get("{$this->baseUrl}/destination/domestic-destination", [
                        'search' => $search,
                        'limit'  => 20,
                        'offset' => 0,
                    ]);

                if (! $response->successful()) {
                    Log::warning('RajaOngkir searchDestinations failed', ['status' => $response->status()]);
                    return [];
                }

                $results = $response->json('data', []);
                if (! is_array($results)) {
                    return [];
                }

                return collect($results)->map(fn ($d) => [
                    'id'       => (int) $d['id'],
                    'name'     => $d['label'] ?? '',
                    'province' => $d['province_name'] ?? '',
                    'city'     => $d['city_name'] ?? '',
                ])->filter(fn ($d) => $d['id'] > 0)->values()->all();

            } catch (\Throwable $e) {
                Log::warning('RajaOngkir searchDestinations exception', ['error' => $e->getMessage()]);
                return [];
            }
        });
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
