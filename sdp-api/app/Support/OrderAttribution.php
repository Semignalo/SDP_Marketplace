<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Atribusi iklan (UTM + Meta click/browser id) yang dikirim frontend saat checkout.
 * Nilai dari client tidak dipercaya: dipotong panjangnya, dibersihkan dari karakter
 * kontrol, dan hanya jadi label laporan — tidak pernah memengaruhi harga atau status.
 */
class OrderAttribution
{
    /** Jendela atribusi (hari) — disamakan dengan window klik Meta. */
    public const WINDOW_DAYS = 7;

    public const RULES = [
        'attribution' => 'nullable|array',
        'attribution.utm_source' => 'nullable|string|max:191',
        'attribution.utm_medium' => 'nullable|string|max:191',
        'attribution.utm_campaign' => 'nullable|string|max:191',
        'attribution.utm_content' => 'nullable|string|max:191',
        'attribution.utm_term' => 'nullable|string|max:191',
        'attribution.fbclid' => 'nullable|string|max:255',
        'attribution.fbc' => 'nullable|string|max:255',
        'attribution.fbp' => 'nullable|string|max:255',
        'attribution.landing_url' => 'nullable|string|max:500',
        'attribution.captured_at' => 'nullable|integer',
    ];

    /**
     * Kolom orders untuk atribusi + konteks browser.
     *
     * @return array<string, mixed>
     */
    public static function fromRequest(Request $request, array $validated): array
    {
        $in = $validated['attribution'] ?? [];

        $columns = [
            'client_ip' => $request->ip(),
            'client_user_agent' => self::clean($request->userAgent(), 500),
            'fbp' => self::clean($in['fbp'] ?? null, 255),
        ];

        $hasAdTouch = false;
        foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $key) {
            $columns[$key] = self::clean($in[$key] ?? null, 191);
        }
        $columns['fbclid'] = self::clean($in['fbclid'] ?? null, 255);
        $columns['fbc'] = self::clean($in['fbc'] ?? null, 255);
        $columns['landing_url'] = self::clean($in['landing_url'] ?? null, 500);

        foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as $key) {
            if ($columns[$key] !== null) {
                $hasAdTouch = true;
                break;
            }
        }

        $columns['attributed_at'] = $hasAdTouch
            ? self::touchTime($in['captured_at'] ?? null)
            : null;

        // Atribusi lebih tua dari jendela 7 hari tidak dihitung (jaga-jaga client lama/rusak).
        if ($columns['attributed_at'] !== null
            && $columns['attributed_at']->lt(now()->subDays(self::WINDOW_DAYS))) {
            foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'fbc', 'landing_url', 'attributed_at'] as $key) {
                $columns[$key] = null;
            }
        }

        return $columns;
    }

    private static function clean(?string $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '');

        return $value === '' ? null : mb_substr($value, 0, $max);
    }

    /** Epoch milidetik dari browser → Carbon, tidak boleh di masa depan. */
    private static function touchTime(?int $epochMs): Carbon
    {
        if ($epochMs === null) {
            return now();
        }

        $time = Carbon::createFromTimestampMs($epochMs);

        return $time->isFuture() ? now() : $time;
    }
}
