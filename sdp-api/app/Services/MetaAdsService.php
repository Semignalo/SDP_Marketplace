<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Baca spend iklan dari Meta Marketing API (read-only, izin ads_read).
 * Best-effort: kalau token kosong atau API gagal, return null dan laporan tetap
 * tampil tanpa spend.
 */
class MetaAdsService
{
    private const CACHE_SECONDS = 900;
    private const MAX_PAGES = 10;

    public function isConfigured(): bool
    {
        return (string) config('services.meta.ads_access_token') !== ''
            && (string) config('services.meta.ad_account_id') !== '';
    }

    /**
     * Spend per campaign & per iklan untuk rentang tanggal.
     *
     * @return array{currency: ?string, campaigns: array<string, array{name: string, spend: float, ads: array<string, array{name: string, spend: float}>}>}|null
     */
    public function spend(Carbon $start, Carbon $end): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $since = $start->toDateString();
        $until = $end->toDateString();
        $cacheKey = "meta.ads.spend.{$since}.{$until}";

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $result = $this->fetch($since, $until);
        } catch (Throwable $e) {
            Log::warning('Meta Ads insights failed', ['error' => $e->getMessage()]);

            return null;
        }

        // Hanya sukses yang di-cache — kegagalan dicoba lagi di request berikutnya.
        Cache::put($cacheKey, $result, self::CACHE_SECONDS);

        return $result;
    }

    private function fetch(string $since, string $until): array
    {
        $account = (string) config('services.meta.ad_account_id');
        $account = str_starts_with($account, 'act_') ? $account : "act_{$account}";
        $version = config('services.meta.graph_version', 'v21.0');
        $token = (string) config('services.meta.ads_access_token');

        // Workaround SSL cert untuk Windows/Laragon dev — tidak dipakai di production.
        $http = Http::timeout(15)->withToken($token);
        if (app()->environment('local')) {
            $http = $http->withoutVerifying();
        }

        $response = $http->get("https://graph.facebook.com/{$version}/{$account}/insights", [
            'level' => 'ad',
            'fields' => 'campaign_id,campaign_name,ad_id,ad_name,spend,account_currency',
            'time_range' => json_encode(['since' => $since, 'until' => $until]),
            'limit' => 500,
        ]);

        $currency = null;
        $campaigns = [];

        for ($page = 0; $page < self::MAX_PAGES; $page++) {
            if (! $response->successful()) {
                throw new \RuntimeException('Meta insights HTTP ' . $response->status() . ': ' . $response->body());
            }

            $json = $response->json();

            foreach ($json['data'] ?? [] as $row) {
                $cid = (string) ($row['campaign_id'] ?? '');
                $aid = (string) ($row['ad_id'] ?? '');
                if ($cid === '') {
                    continue;
                }

                $currency ??= $row['account_currency'] ?? null;
                $spend = (float) ($row['spend'] ?? 0);

                $campaigns[$cid] ??= ['name' => (string) ($row['campaign_name'] ?? $cid), 'spend' => 0.0, 'ads' => []];
                $campaigns[$cid]['spend'] += $spend;

                if ($aid !== '') {
                    $campaigns[$cid]['ads'][$aid] ??= ['name' => (string) ($row['ad_name'] ?? $aid), 'spend' => 0.0];
                    $campaigns[$cid]['ads'][$aid]['spend'] += $spend;
                }
            }

            $next = $json['paging']['next'] ?? null;
            if (! $next) {
                break;
            }

            $response = $http->get($next);
        }

        return ['currency' => $currency, 'campaigns' => $campaigns];
    }
}
