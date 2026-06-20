<?php

namespace App\Support;

class CourierTracking
{
    // Halaman lacak resmi tiap kurir. Mayoritas kurir Indonesia memproses
    // pencarian resi via form AJAX, jadi tidak ada query parameter standar
    // yang reliable lintas kurir — link mengarah ke halaman tracking resmi,
    // nomor resi tetap ditampilkan di sisi kami untuk disalin manual.
    private const COURIER_URLS = [
        'jne' => 'https://www.jne.co.id/id/tracking/trace',
        'jnt' => 'https://jet.co.id/track',
        'j&t' => 'https://jet.co.id/track',
        'sicepat' => 'https://www.sicepat.com/cek-resi',
        'anteraja' => 'https://anteraja.id/tracking',
        'pos' => 'https://www.posindonesia.co.id/id/tracking',
        'tiki' => 'https://www.tiki.id/id/tracking',
    ];

    public static function url(?string $courierName): ?string
    {
        if (! $courierName) {
            return null;
        }

        $needle = strtolower($courierName);
        foreach (self::COURIER_URLS as $key => $url) {
            if (str_contains($needle, $key)) {
                return $url;
            }
        }

        return null;
    }
}
