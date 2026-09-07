<?php

namespace App\Http\Controllers\Concerns;

use App\Services\GeoLocationService;
use App\Support\WorldCountries;
use Illuminate\Http\Request;

/**
 * Menentukan negara yang berlaku untuk satu request storefront, lalu menaruhnya di
 * request attributes supaya Resource tidak perlu menghitung ulang per-produk
 * (pola yang sama dengan tier context di ProductController).
 */
trait ResolvesRegion
{
    /**
     * Pilihan manual customer (?country=AU dari region switcher) menang atas geo-IP —
     * deteksi IP sering meleset kalau pakai VPN, dan pilihan eksplisit user harus dihormati.
     * Diterima untuk SEMUA negara dunia (WorldCountries, ~200), bukan cuma 4 pricing
     * countries — supaya Regional Stock (yang scope-nya terbuka) bisa berlaku untuk
     * negara manapun yang dipilih customer.
     */
    protected function attachRegionContext(Request $request): string
    {
        $requested = strtoupper((string) $request->query('country', ''));

        if ($requested !== '' && WorldCountries::isValidCode($requested)) {
            $country = $requested;
        } else {
            /*
             * Fallback: pakai RAW hasil geo-IP (detected_country, bisa negara manapun),
             * BUKAN country_code dari resolve() yang sengaja di-collapse ke fallback_country
             * untuk kebutuhan currency display (lihat GeoLocationService::resolve() &
             * StorefrontController::region() — keduanya TIDAK diubah, tetap pakai
             * country_code apa adanya). Di sini kita mau tahu negara ASLI hasil deteksi
             * supaya Regional Stock ikut auto-detect, bukan cuma lewat pilihan manual.
             */
            $detected = app(GeoLocationService::class)->resolve($request->ip())['detected_country'] ?? null;
            $country = ($detected && WorldCountries::isValidCode($detected))
                ? $detected
                : config('regions.fallback_country', 'ID');
        }

        $request->attributes->set('region_country', $country);

        return $country;
    }

    protected function regionCountry(Request $request): ?string
    {
        return $request->attributes->get('region_country');
    }
}
