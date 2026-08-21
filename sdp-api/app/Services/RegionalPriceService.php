<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductRegionalPrice;
use App\Models\User;
use App\Support\Regions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Simpan/hapus override harga per negara. Dipakai bareng oleh panel admin dan vendor —
 * aturannya identik, yang beda cuma siapa yang boleh menyentuh produk mana (dicek di controller).
 */
class RegionalPriceService
{
    public function __construct(private ExchangeRateService $rates)
    {
    }

    /**
     * Aturan validasi untuk payload override, dipakai di admin & vendor controller.
     */
    public static function rules(): array
    {
        $allowed = implode(',', Regions::pricingCountries());

        return [
            'prices' => 'required|array',
            'prices.*.country_code' => "required|string|in:{$allowed}",
            // null = hapus override untuk negara itu, kembali ke harga dasar produk.
            'prices.*.amount' => 'nullable|numeric|min:0',
            'prices.*.mode' => 'nullable|in:idr,native',
        ];
    }

    /**
     * @param array $entries daftar {country_code, amount, mode}
     */
    public function sync(Product $product, array $entries, ?User $actor = null): void
    {
        DB::transaction(function () use ($product, $entries, $actor) {
            foreach ($entries as $entry) {
                $country = strtoupper($entry['country_code']);
                $amount = $entry['amount'] ?? null;

                if ($amount === null || $amount === '') {
                    ProductRegionalPrice::where('product_id', $product->id)
                        ->where('country_code', $country)
                        ->delete();
                    continue;
                }

                $this->upsert($product, $country, (float) $amount, $entry['mode'] ?? 'idr', $actor);
            }
        });
    }

    private function upsert(Product $product, string $country, float $amount, string $mode, ?User $actor): void
    {
        if ($mode === 'native') {
            $currency = Regions::currencyFor($country);
            $rate = $currency ? $this->rates->rateFor($currency) : null;

            if ($rate === null) {
                // Tanpa kurs, angka native tidak bisa dibekukan jadi IDR — lebih baik
                // menolak daripada menyimpan harga yang salah.
                throw ValidationException::withMessages([
                    'prices' => "Kurs {$currency} belum tersedia. Jalankan `php artisan rates:fetch` dulu, atau input harga dalam IDR.",
                ]);
            }

            $priceIdr = round($amount * $rate, 2);
            $inputCurrency = $currency;
            $inputAmount = $amount;
            $inputRate = $rate;
        } else {
            // Input langsung dalam IDR — tidak ada konversi, tidak ada ketergantungan ke kurs.
            $priceIdr = round($amount, 2);
            $inputCurrency = null;
            $inputAmount = null;
            $inputRate = null;
        }

        ProductRegionalPrice::updateOrCreate(
            ['product_id' => $product->id, 'country_code' => $country],
            [
                'price_idr' => $priceIdr,
                'input_currency' => $inputCurrency,
                'input_amount' => $inputAmount,
                'input_rate_to_idr' => $inputRate,
                'set_by_user_id' => $actor?->id,
            ],
        );
    }

    /**
     * Bentuk tampilan untuk panel: satu baris per negara yang boleh di-override,
     * termasuk negara yang belum punya override (amount null) supaya form-nya lengkap.
     */
    public function overview(Product $product): array
    {
        $existing = $product->regionalPrices()->get()->keyBy('country_code');
        $rates = $this->rates->rates();

        return collect(Regions::pricingCountries())
            ->map(function ($code) use ($existing, $rates, $product) {
                $row = $existing->get($code);
                $currency = Regions::currencyFor($code);
                $rate = $rates[$currency] ?? null;
                $priceIdr = $row ? (float) $row->price_idr : (float) $product->price;

                return [
                    'country_code' => $code,
                    'country_name' => config("regions.countries.{$code}.name"),
                    'currency' => $currency,
                    'rate_to_idr' => $rate,
                    'has_override' => (bool) $row,
                    'price_idr' => $priceIdr,
                    // Perkiraan tampilan di storefront untuk negara ini.
                    'price_native' => $rate ? round($priceIdr / $rate, 2) : null,
                    'input_currency' => $row?->input_currency,
                    'input_amount' => $row ? ($row->input_amount !== null ? (float) $row->input_amount : null) : null,
                    'updated_at' => $row?->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }
}
