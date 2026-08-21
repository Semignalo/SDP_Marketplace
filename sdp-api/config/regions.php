<?php

/*
 * Sumber tunggal daftar region yang didukung storefront (Localized Storefront).
 * Dipakai bareng oleh GeoLocationService, ExchangeRateService, regional pricing,
 * dan divalidasi di endpoint admin/vendor — jadi kalau nambah negara, cukup di sini.
 *
 * Catatan: kode di sini ISO 3166-1 alpha-2 (AU/IN/PH), BEDA dengan kolom
 * `shipping_rates.country_code` yang pakai kode 3 huruf ala OGB (AUS/PHL/USA).
 * Dua-duanya sengaja dibiarkan terpisah — shipping masih manual quote.
 */
return [
    // Semua harga disimpan & ditagih dalam mata uang ini. Currency lain cuma tampilan.
    'base_currency' => 'IDR',

    /*
     * Negara yang storefront-nya dilokalkan. `currency` dipakai untuk tampilan harga,
     * `locale` untuk Intl.NumberFormat di frontend.
     */
    'countries' => [
        'ID' => ['name' => 'Indonesia', 'currency' => 'IDR', 'locale' => 'id-ID'],
        'AU' => ['name' => 'Australia', 'currency' => 'AUD', 'locale' => 'en-AU'],
        'IN' => ['name' => 'India', 'currency' => 'INR', 'locale' => 'en-IN'],
        'PH' => ['name' => 'Philippines', 'currency' => 'PHP', 'locale' => 'en-PH'],
    ],

    /*
     * Currency yang bisa dipilih manual di switcher, walau negaranya belum dilokalkan.
     * USD tetap ada karena toggle IDR/USD lama sudah dipakai sebelum fitur ini.
     */
    'extra_currencies' => [
        'USD' => ['locale' => 'en-US'],
    ],

    /*
     * Negara yang harganya boleh di-override manual oleh admin/vendor.
     * Indonesia tidak termasuk — itu harga dasar produk, bukan override.
     */
    'pricing_countries' => ['AU', 'IN', 'PH'],

    // Fallback kalau IP tidak terdeteksi / negaranya belum didukung.
    'fallback_country' => 'ID',
];
