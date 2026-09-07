<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductRegionalStock;
use App\Models\User;
use App\Support\WorldCountries;
use Illuminate\Support\Facades\DB;

/**
 * Simpan/hapus alokasi stok per negara. Dipakai bareng oleh panel admin dan vendor —
 * aturannya identik, yang beda cuma siapa yang boleh menyentuh produk mana (dicek di controller).
 *
 * Beda penting dari RegionalPriceService: daftar negara di sini TERBUKA (bukan fixed
 * 3 negara), jadi frontend mengirim seluruh baris current state tiap kali save,
 * termasuk baris yang mau dihapus (qty: null) — negara yang sama sekali tidak
 * dikirim di $entries dibiarkan apa adanya (tidak dihapus).
 */
class RegionalStockService
{
    public static function rules(): array
    {
        return [
            'stocks' => 'required|array',
            'stocks.*.country_code' => ['required', 'string', function ($attribute, $value, $fail) {
                if (! WorldCountries::isValidCode($value)) {
                    $fail('Unknown country code.');
                }
            }],
            // null/kosong = hapus override untuk negara itu, kembali ke stock global tanpa batas.
            'stocks.*.qty' => 'nullable|integer|min:0',
        ];
    }

    /**
     * @param array $entries daftar {country_code, qty}
     */
    public function sync(Product $product, array $entries, ?User $actor = null): void
    {
        DB::transaction(function () use ($product, $entries, $actor) {
            foreach ($entries as $entry) {
                $country = strtoupper($entry['country_code']);
                $qty = $entry['qty'] ?? null;

                if ($qty === null || $qty === '') {
                    ProductRegionalStock::where('product_id', $product->id)
                        ->where('country_code', $country)
                        ->delete();
                    continue;
                }

                $this->upsert($product, $country, (int) $qty, $actor);
            }
        });
    }

    private function upsert(Product $product, string $country, int $qty, ?User $actor): void
    {
        $existing = ProductRegionalStock::where('product_id', $product->id)
            ->where('country_code', $country)
            ->lockForUpdate()
            ->first();

        if (! $existing) {
            ProductRegionalStock::create([
                'product_id' => $product->id,
                'country_code' => $country,
                'allocated_qty' => $qty,
                'remaining_qty' => $qty,
                'set_by_user_id' => $actor?->id,
            ]);

            return;
        }

        /*
         * Rekonsiliasi: pertahankan unit yang SUDAH terjual dari pool ini.
         * consumed = allocated lama - remaining lama (unit yang sudah dipesan dari pool ini).
         * remaining baru = qty baru - consumed, floor di 0 — kalau admin menurunkan alokasi
         * di bawah yang sudah terjual, remaining jadi 0 ("habis buat negara ini" ke depan),
         * TIDAK membatalkan atau mengubah order yang sudah ada.
         */
        $consumed = max(0, $existing->allocated_qty - $existing->remaining_qty);

        $existing->update([
            'allocated_qty' => $qty,
            'remaining_qty' => max(0, $qty - $consumed),
            'set_by_user_id' => $actor?->id,
        ]);
    }

    /**
     * Beda dari RegionalPriceService::overview(): cuma return negara yang MEMANG
     * punya override (list terbuka, bukan form fixed 3 negara).
     */
    public function overview(Product $product): array
    {
        return $product->regionalStocks()
            ->orderBy('country_code')
            ->get()
            ->map(fn (ProductRegionalStock $row) => [
                'id' => $row->id,
                'country_code' => $row->country_code,
                'country_name' => WorldCountries::nameFor($row->country_code),
                'allocated_qty' => (int) $row->allocated_qty,
                'remaining_qty' => (int) $row->remaining_qty,
                'consumed_qty' => max(0, (int) $row->allocated_qty - (int) $row->remaining_qty),
                'updated_at' => $row->updated_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
