<?php

namespace App\Services;

use App\Models\Setting;

class ShippingZoneService
{
    public const ZONE_JAWA_BALI = 1;
    public const ZONE_LUAR_JAWA = 2;
    public const ZONE_MANUAL = 3;

    // Provinsi yang ongkir riilnya bisa jomplang jauh dari rata-rata "luar Jawa" —
    // dialihkan ke review manual admin, bukan dipaksa pakai flat rate.
    private const MANUAL_PROVINCES = [
        'MALUKU', 'MALUKU UTARA',
        'PAPUA', 'PAPUA BARAT', 'PAPUA TENGAH', 'PAPUA PEGUNUNGAN',
        'PAPUA SELATAN', 'PAPUA BARAT DAYA',
    ];

    private const PROVINCE_ZONES = [
        'DKI JAKARTA' => self::ZONE_JAWA_BALI,
        'JAWA BARAT' => self::ZONE_JAWA_BALI,
        'BANTEN' => self::ZONE_JAWA_BALI,
        'JAWA TENGAH' => self::ZONE_JAWA_BALI,
        'DI YOGYAKARTA' => self::ZONE_JAWA_BALI,
        'DAERAH ISTIMEWA YOGYAKARTA' => self::ZONE_JAWA_BALI,
        'JAWA TIMUR' => self::ZONE_JAWA_BALI,
        'BALI' => self::ZONE_JAWA_BALI,

        'ACEH' => self::ZONE_LUAR_JAWA,
        'SUMATERA UTARA' => self::ZONE_LUAR_JAWA,
        'SUMATERA BARAT' => self::ZONE_LUAR_JAWA,
        'RIAU' => self::ZONE_LUAR_JAWA,
        'KEPULAUAN RIAU' => self::ZONE_LUAR_JAWA,
        'JAMBI' => self::ZONE_LUAR_JAWA,
        'SUMATERA SELATAN' => self::ZONE_LUAR_JAWA,
        'BENGKULU' => self::ZONE_LUAR_JAWA,
        'LAMPUNG' => self::ZONE_LUAR_JAWA,
        'KEPULAUAN BANGKA BELITUNG' => self::ZONE_LUAR_JAWA,
        'KALIMANTAN BARAT' => self::ZONE_LUAR_JAWA,
        'KALIMANTAN TENGAH' => self::ZONE_LUAR_JAWA,
        'KALIMANTAN SELATAN' => self::ZONE_LUAR_JAWA,
        'KALIMANTAN TIMUR' => self::ZONE_LUAR_JAWA,
        'KALIMANTAN UTARA' => self::ZONE_LUAR_JAWA,
        'SULAWESI UTARA' => self::ZONE_LUAR_JAWA,
        'SULAWESI TENGAH' => self::ZONE_LUAR_JAWA,
        'SULAWESI SELATAN' => self::ZONE_LUAR_JAWA,
        'SULAWESI TENGGARA' => self::ZONE_LUAR_JAWA,
        'GORONTALO' => self::ZONE_LUAR_JAWA,
        'SULAWESI BARAT' => self::ZONE_LUAR_JAWA,
        'NUSA TENGGARA BARAT' => self::ZONE_LUAR_JAWA,
        'NUSA TENGGARA TIMUR' => self::ZONE_LUAR_JAWA,

        'MALUKU' => self::ZONE_MANUAL,
        'MALUKU UTARA' => self::ZONE_MANUAL,
        'PAPUA' => self::ZONE_MANUAL,
        'PAPUA BARAT' => self::ZONE_MANUAL,
        'PAPUA TENGAH' => self::ZONE_MANUAL,
        'PAPUA PEGUNUNGAN' => self::ZONE_MANUAL,
        'PAPUA SELATAN' => self::ZONE_MANUAL,
        'PAPUA BARAT DAYA' => self::ZONE_MANUAL,
    ];

    /**
     * Hitung ongkir flat berdasarkan provinsi tujuan + berat.
     * Provinsi tidak dikenali/kosong dianggap zona "luar Jawa" (lebih mahal, lebih aman daripada nombok).
     *
     * @return array{zone:int, requires_manual:bool, cost:?int, label:string}
     */
    public function quote(?string $province, int $weightGram): array
    {
        $zone = $this->resolveZone($province);

        if ($zone === self::ZONE_MANUAL) {
            return [
                'zone' => $zone,
                'requires_manual' => true,
                'cost' => null,
                'label' => 'Maluku & Papua',
            ];
        }

        $tiers = $this->ratesForZone($zone);
        $cost = match (true) {
            $weightGram <= 1000 => $tiers['1kg'],
            $weightGram <= 3000 => $tiers['3kg'],
            // Di atas 3kg: rate max + kelipatan per kg untuk sisa berat, biar order
            // berat banget (mis. bulk order) gak disubsidi flat rate yang sama dengan 3.1kg.
            default => $tiers['max'] + ((int) ceil(($weightGram - 3000) / 1000)) * $tiers['per_kg'],
        };

        return [
            'zone' => $zone,
            'requires_manual' => false,
            'cost' => $cost,
            'label' => $zone === self::ZONE_JAWA_BALI ? 'Jawa & Bali' : 'Luar Jawa',
        ];
    }

    public function resolveZone(?string $province): int
    {
        if (! $province) {
            return self::ZONE_LUAR_JAWA;
        }

        $needle = $this->normalize($province);

        foreach (self::PROVINCE_ZONES as $name => $zone) {
            if ($needle === $name || str_contains($needle, $name)) {
                return $zone;
            }
        }

        return self::ZONE_LUAR_JAWA;
    }

    private function normalize(string $province): string
    {
        return strtoupper(trim($province));
    }

    private function ratesForZone(int $zone): array
    {
        if ($zone === self::ZONE_JAWA_BALI) {
            return [
                '1kg' => (int) Setting::get('shipping_zone1_rate_1kg', 20000),
                '3kg' => (int) Setting::get('shipping_zone1_rate_3kg', 27000),
                'max' => (int) Setting::get('shipping_zone1_rate_max', 35000),
                'per_kg' => (int) Setting::get('shipping_zone1_rate_per_kg', 5000),
            ];
        }

        return [
            '1kg' => (int) Setting::get('shipping_zone2_rate_1kg', 35000),
            '3kg' => (int) Setting::get('shipping_zone2_rate_3kg', 45000),
            'max' => (int) Setting::get('shipping_zone2_rate_max', 60000),
            'per_kg' => (int) Setting::get('shipping_zone2_rate_per_kg', 8000),
        ];
    }
}
