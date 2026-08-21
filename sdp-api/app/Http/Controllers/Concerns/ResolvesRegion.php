<?php

namespace App\Http\Controllers\Concerns;

use App\Services\GeoLocationService;
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
     */
    protected function attachRegionContext(Request $request): string
    {
        $requested = strtoupper((string) $request->query('country', ''));
        $known = array_keys(config('regions.countries', []));

        if ($requested !== '' && in_array($requested, $known, true)) {
            $country = $requested;
        } else {
            $country = app(GeoLocationService::class)->resolve($request->ip())['country_code'];
        }

        $request->attributes->set('region_country', $country);

        return $country;
    }

    protected function regionCountry(Request $request): ?string
    {
        return $request->attributes->get('region_country');
    }
}
