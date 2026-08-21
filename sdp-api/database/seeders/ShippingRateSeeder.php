<?php

namespace Database\Seeders;

use App\Models\ShippingRate;
use Illuminate\Database\Seeder;

/**
 * Sumber: "OGB x Starinc Quoting Sheet" (dikonfirmasi 2026-08-13). Semua rate dalam Rupiah,
 * flat (weight_kg=999 berarti "berlaku untuk berat berapapun" — belum ada data bertingkat).
 * Produk acuan: 17x12x6cm, ~0.5kg, dikirim dari Surabaya.
 *
 * FSC (Fuel Surcharge) selalu 10% dari base_rate. `add_fee_custom` untuk France/Italy/
 * Germany/Sweden bukan biaya asal-asalan — itu selisih supaya total match persis dengan
 * final_price_idr yang dikonfirmasi (base+fsc+esc+ogb saja kurang Rp60.000 dari totalnya
 * buat 4 negara itu; kemungkinan biaya dokumen/customs Eropa yang tidak diitemize terpisah).
 *
 * Malaysia awalnya 2 rate (Barat/Timur) tapi form checkout belum bisa membedakan customer
 * di zona mana, jadi digabung jadi 1 flat rate (rata-rata keduanya) supaya tetap bisa
 * auto-quote tanpa risiko salah zona.
 */
class ShippingRateSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['id' => 'SGP', 'country' => 'Singapore', 'zone' => null, 'final' => 70000, 'base' => 70000, 'fsc' => null, 'esc' => null, 'ogb' => null, 'service' => 'BASIC', 'term' => 'DDU', 'days' => '2-3', 'note' => 'Flat rate, minimum charge 1 kg', 'active' => true],
            ['id' => 'MYS', 'country' => 'Malaysia', 'zone' => null, 'final' => 82500, 'base' => 82500, 'fsc' => null, 'esc' => null, 'ogb' => null, 'service' => 'BASIC', 'term' => 'DDU', 'days' => null, 'note' => 'Flat rate gabungan Barat & Timur (rata-rata)', 'active' => true],
            ['id' => 'AUS', 'country' => 'Australia', 'zone' => null, 'final' => 176400, 'base' => 176400, 'fsc' => null, 'esc' => null, 'ogb' => null, 'service' => 'STANDARD', 'term' => 'DDP', 'days' => '3-6', 'note' => 'Shipping A$11.70 + Fulfilment A$3.00 = A$14.70 (kurs A$1=Rp12.000). Fulfilment fee termasuk pick & pack, label, paperwork, fuel surcharge', 'active' => true],
            ['id' => 'JPN', 'country' => 'Japan', 'zone' => null, 'final' => 306500, 'base' => 265000, 'fsc' => 26500, 'esc' => 0, 'ogb' => 15000, 'service' => 'BASIC', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'PHL', 'country' => 'Philippines', 'zone' => null, 'final' => 285000, 'base' => 250000, 'fsc' => 25000, 'esc' => 0, 'ogb' => 10000, 'service' => 'BASIC', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'UK', 'country' => 'United Kingdom', 'zone' => null, 'final' => 264500, 'base' => 195000, 'fsc' => 19500, 'esc' => 20000, 'ogb' => 30000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'USA', 'country' => 'United States', 'zone' => null, 'final' => 401200, 'base' => 342000, 'fsc' => 34200, 'esc' => 10000, 'ogb' => 15000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'GER', 'country' => 'Germany', 'zone' => null, 'final' => 505500, 'base' => 375000, 'fsc' => 37500, 'esc' => 20000, 'ogb' => 13000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'NZL', 'country' => 'New Zealand', 'zone' => null, 'final' => 579054, 'base' => 503686, 'fsc' => 50368, 'esc' => 0, 'ogb' => 25000, 'service' => 'EXPRESS', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'SLK', 'country' => 'Sri Lanka', 'zone' => null, 'final' => 602500, 'base' => 525000, 'fsc' => 52500, 'esc' => 0, 'ogb' => 25000, 'service' => 'EXPRESS', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'CAN', 'country' => 'Canada', 'zone' => null, 'final' => 656400, 'base' => 574000, 'fsc' => 57400, 'esc' => 0, 'ogb' => 25000, 'service' => 'EXPRESS', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'BHR', 'country' => 'Bahrain', 'zone' => null, 'final' => 686225, 'base' => 601114, 'fsc' => 60111, 'esc' => 0, 'ogb' => 25000, 'service' => 'EXPRESS', 'term' => 'DDU', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'FRA', 'country' => 'France', 'zone' => null, 'final' => 720000, 'base' => 570000, 'fsc' => 57000, 'esc' => 20000, 'ogb' => 13000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'ITA', 'country' => 'Italy', 'zone' => null, 'final' => 717000, 'base' => 570000, 'fsc' => 57000, 'esc' => 20000, 'ogb' => 10000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
            ['id' => 'SWE', 'country' => 'Sweden', 'zone' => null, 'final' => 816000, 'base' => 660000, 'fsc' => 66000, 'esc' => 20000, 'ogb' => 10000, 'service' => 'BASIC', 'term' => 'DDP', 'days' => null, 'note' => null, 'active' => true],
        ];

        foreach ($rows as $r) {
            $base = $r['base'];
            $fscPercent = $r['fsc'] !== null ? 10 : 0;
            $fscAmount = round($base * $fscPercent / 100);
            $esc = $r['esc'] ?? 0;
            $ogb = $r['ogb'] ?? 0;
            // Selisih ke final_price_idr yang dikonfirmasi — lihat catatan class di atas.
            $customFee = max(0, (int) round($r['final'] - $base - $fscAmount - $esc - $ogb));

            $notesParts = array_filter([
                $r['note'],
                $r['days'] ? "Estimasi {$r['days']} hari" : null,
                'Sumber: OGB x Starinc Quoting Sheet',
            ]);

            ShippingRate::updateOrCreate(
                [
                    'country_code' => $r['id'],
                    'zone' => $r['zone'],
                    'weight_kg' => 999,
                    'length_cm' => 17,
                    'width_cm' => 12,
                    'height_cm' => 6,
                    'service' => $r['service'],
                    'term' => $r['term'],
                ],
                [
                    'country' => $r['country'],
                    'base_rate' => $base,
                    'fsc_percent' => $fscPercent,
                    'esc_amount' => $esc,
                    'add_fee_custom' => $customFee,
                    'ogb_fee' => $ogb,
                    'notes' => implode(' — ', $notesParts) ?: null,
                    'is_active' => $r['active'],
                ]
            );
        }
    }
}
