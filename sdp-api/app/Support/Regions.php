<?php

namespace App\Support;

/**
 * Helper kecil di sekitar config/regions.php.
 */
class Regions
{
    /**
     * Nama negara (seperti yang tersimpan di orders.shipping_country / addresses.country)
     * ke kode ISO-2. Return null kalau negaranya bukan region yang dilokalkan.
     *
     * Dipakai saat checkout: harga regional ditentukan oleh negara TUJUAN KIRIM,
     * bukan negara tempat customer browsing — supaya harga tidak bisa dimainkan
     * dengan cara mengganti region switcher sesaat sebelum bayar.
     */
    public static function codeFromName(?string $name): ?string
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        $needle = strtolower(trim($name));

        foreach (config('regions.countries', []) as $code => $region) {
            if (strtolower($region['name']) === $needle || strtolower($code) === $needle) {
                return $code;
            }
        }

        return null;
    }

    /** Negara yang harganya boleh di-override admin/vendor. */
    public static function pricingCountries(): array
    {
        return config('regions.pricing_countries', []);
    }

    public static function isPricingCountry(?string $code): bool
    {
        return $code !== null && in_array($code, self::pricingCountries(), true);
    }

    public static function currencyFor(?string $code): ?string
    {
        return config("regions.countries.{$code}.currency");
    }
}
