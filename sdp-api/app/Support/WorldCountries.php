<?php

namespace App\Support;

/**
 * Daftar negara dunia (config/countries.php, ~200 negara) — KHUSUS dipakai Regional Stock.
 *
 * Sengaja class terpisah dari Regions (yang cuma kenal 4 negara "pricing_countries").
 * Regional stock scope-nya terbuka ke negara manapun, beda dari regional price yang
 * sengaja dibatasi ke AU/IN/PH karena butuh currency/kurs. JANGAN pakai class ini
 * untuk keputusan harga — tetap pakai Regions::class untuk itu.
 */
class WorldCountries
{
    public static function all(): array
    {
        return config('countries', []);
    }

    public static function isValidCode(?string $code): bool
    {
        if ($code === null || $code === '') {
            return false;
        }

        return array_key_exists(strtoupper($code), self::all());
    }

    public static function nameFor(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }

        return self::all()[strtoupper($code)] ?? null;
    }

    /**
     * Resolve nama negara free-text (field shipping_country di checkout, hasil
     * autocomplete CountrySearchInput) ke ISO-2 — exact match case-insensitive
     * terhadap SEMUA ~200 negara. Beda dari Regions::codeFromName() yang cuma
     * kenal 4 pricing countries.
     *
     * Return null kalau tidak match persis (typo/nama gak baku) — pemanggil
     * memperlakukan ini sebagai "tidak ada alokasi regional yang berlaku",
     * sama seperti perilaku Regions::codeFromName() untuk harga.
     */
    public static function codeFromName(?string $name): ?string
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        $needle = strtolower(trim($name));

        foreach (self::all() as $code => $countryName) {
            if (strtolower($countryName) === $needle || strtolower($code) === $needle) {
                return $code;
            }
        }

        return null;
    }
}
