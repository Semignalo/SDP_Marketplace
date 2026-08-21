<?php

namespace App\Services;

use App\Models\ShippingRate;

/**
 * Ongkir internasional otomatis — pola sama seperti ShippingZoneService (domestik):
 * quote() mengembalikan cost kalau ada rate yang cocok, atau requires_manual kalau tidak.
 *
 * Cocokkan berdasarkan NAMA negara (kolom `shipping_country` di order itu free-text,
 * bukan dropdown terkontrol) — dibandingkan case-insensitive. Kalau customer salah ketik
 * atau negaranya belum ada rate-nya, jatuh ke manual quote seperti sebelumnya — aman,
 * bukan salah harga.
 *
 * Sekarang baru dukung flat rate (1 rate per negara, weight_kg di baris data cuma
 * placeholder). Begitu ada data bertingkat per berat, logic pemilihan tier di bawah
 * sudah siap pakai tanpa perlu diubah — tinggal tambah baris lagi per negara di
 * `shipping_rates` dengan weight_kg berbeda.
 */
class InternationalShippingService
{
    /**
     * @return array{requires_manual:bool, cost:?int, label:string, rate_id:?int}
     */
    public function quote(?string $countryName, int $weightGram): array
    {
        $needle = strtoupper(trim((string) $countryName));

        if ($needle === '') {
            return ['requires_manual' => true, 'cost' => null, 'label' => (string) $countryName, 'rate_id' => null];
        }

        $rates = ShippingRate::query()
            ->whereRaw('UPPER(country) = ?', [$needle])
            ->where('is_active', true)
            ->orderBy('weight_kg')
            ->get();

        if ($rates->isEmpty()) {
            return ['requires_manual' => true, 'cost' => null, 'label' => $countryName, 'rate_id' => null];
        }

        $weightKg = $weightGram / 1000;

        // Tier terkecil yang masih cukup buat berat order ini. Kalau order lebih berat
        // dari semua tier yang ada, TIDAK ditebak (extrapolasi bisa nombok) — jatuh ke manual.
        $match = $rates->first(fn (ShippingRate $r) => (float) $r->weight_kg >= $weightKg);

        if (! $match) {
            return ['requires_manual' => true, 'cost' => null, 'label' => $countryName, 'rate_id' => null];
        }

        return [
            'requires_manual' => false,
            'cost' => $match->final_price,
            'label' => $match->country,
            'rate_id' => $match->id,
        ];
    }
}
