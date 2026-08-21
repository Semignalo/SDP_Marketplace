<?php

namespace App\Services;

use App\Models\ExchangeRate;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Kurs untuk MENAMPILKAN harga dalam mata uang lokal. Bukan untuk menagih —
 * semua order tetap dibuat & dibayar dalam IDR lewat Midtrans, jadi kurs yang
 * bergerak tidak pernah mengubah jumlah yang ditagih ke customer.
 *
 * Rate disimpan sebagai "berapa IDR untuk 1 unit currency" (lihat migration).
 */
class ExchangeRateService
{
    private const CACHE_KEY = 'exchange_rates_map';
    private const CACHE_TTL = 900; // 15 menit — tabelnya sendiri di-refresh via schedule
    private const ENDPOINT = 'https://open.er-api.com/v6/latest/IDR';

    /**
     * Kurs yang berlaku, sudah termasuk override manual admin.
     * Return: ['AUD' => 10500.0, 'INR' => 190.5, ...]
     */
    public function rates(): array
    {
        $rates = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return ExchangeRate::query()
                ->pluck('rate_to_idr', 'currency_code')
                ->map(fn ($r) => (float) $r)
                ->all();
        });

        /*
         * USD sudah punya rate manual yang dipakai admin panel & invoice sejak sebelum
         * fitur ini (setting `usd_idr_rate`). Angka manual itu tetap menang supaya
         * tampilan USD di storefront dan di admin tidak pernah beda.
         */
        $manualUsd = (float) Setting::get('usd_idr_rate', 0);
        if ($manualUsd > 0) {
            $rates['USD'] = $manualUsd;
        }

        $rates['IDR'] = 1.0;

        return $rates;
    }

    public function rateFor(string $currency): ?float
    {
        $rate = $this->rates()[strtoupper($currency)] ?? null;

        return $rate !== null && $rate > 0 ? $rate : null;
    }

    /**
     * IDR -> mata uang lokal. Return null kalau kursnya belum tersedia, supaya
     * pemanggil bisa memilih menampilkan IDR apa adanya ketimbang angka ngawur.
     */
    public function convertFromIdr(float $amountIdr, string $currency): ?float
    {
        $rate = $this->rateFor($currency);

        return $rate === null ? null : round($amountIdr / $rate, 2);
    }

    /**
     * Mata uang lokal -> IDR. Dipakai saat admin/vendor input harga regional
     * dalam mata uang asing; hasilnya dibekukan jadi harga IDR.
     */
    public function convertToIdr(float $amount, string $currency): ?float
    {
        $rate = $this->rateFor($currency);

        return $rate === null ? null : round($amount * $rate, 2);
    }

    /**
     * Tarik kurs terbaru dan simpan. Kalau API gagal, baris lama sengaja
     * TIDAK dihapus — lebih baik pakai kurs kemarin daripada tidak ada harga sama sekali.
     *
     * @return int jumlah currency yang berhasil di-update
     */
    public function refresh(): int
    {
        $wanted = $this->trackedCurrencies();

        try {
            $response = Http::timeout(15)->get(self::ENDPOINT);

            if (! $response->successful() || $response->json('result') !== 'success') {
                Log::warning('ExchangeRate refresh failed', ['status' => $response->status()]);
                return 0;
            }

            // API mengembalikan "berapa unit X untuk 1 IDR" — kita simpan kebalikannya.
            $perIdr = $response->json('rates', []);
            $fetchedAt = now();
            $updated = 0;

            foreach ($wanted as $code) {
                $value = (float) ($perIdr[$code] ?? 0);
                if ($value <= 0) {
                    continue;
                }

                ExchangeRate::updateOrCreate(
                    ['currency_code' => $code],
                    [
                        'rate_to_idr' => 1 / $value,
                        'source' => 'open.er-api.com',
                        'fetched_at' => $fetchedAt,
                    ],
                );
                $updated++;
            }

            Cache::forget(self::CACHE_KEY);

            return $updated;
        } catch (\Throwable $e) {
            Log::warning('ExchangeRate refresh threw', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Currency yang perlu ditarik kursnya: semua currency negara yang didukung
     * (selain IDR) plus currency ekstra seperti USD.
     */
    public function trackedCurrencies(): array
    {
        $fromCountries = collect(config('regions.countries', []))
            ->pluck('currency')
            ->all();

        $extra = array_keys(config('regions.extra_currencies', []));

        return collect($fromCountries)
            ->merge($extra)
            ->unique()
            ->reject(fn ($c) => $c === config('regions.base_currency', 'IDR'))
            ->values()
            ->all();
    }
}
