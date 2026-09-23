<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\ResolvesDateRange;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\MetaAdsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Laporan penjualan per campaign/iklan (order & revenue dari DB SDP, spend dari Meta).
 */
class AttributionController extends Controller
{
    use ResolvesDateRange;

    // Sama dengan definisi revenue di DashboardController::summary().
    private const PAID_STATUSES = ['processing', 'shipped', 'completed'];

    public function index(Request $request, MetaAdsService $metaAds): JsonResponse
    {
        [$start, $end] = $this->resolveDateRange($request);

        $paid = fn () => Order::whereDate('created_at', '>=', $start)
            ->whereDate('created_at', '<=', $end)
            ->whereIn('status', self::PAID_STATUSES)
            ->whereNull('archived_at');

        $totalOrders = $paid()->count();
        $totalRevenue = (float) $paid()->sum('total');

        $attributed = $paid()
            ->whereNotNull('attributed_at')
            ->select(
                'utm_source',
                'utm_campaign',
                'utm_content',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total) as revenue'),
            )
            ->groupBy('utm_source', 'utm_campaign', 'utm_content')
            ->get();

        $spendStatus = $metaAds->isConfigured() ? 'ok' : 'not_configured';
        $spend = null;
        if ($spendStatus === 'ok') {
            $spend = $metaAds->spend($start, $end);
            if ($spend === null) {
                $spendStatus = 'error';
            }
        }

        $currency = $spend['currency'] ?? null;
        $metaCampaigns = $spend['campaigns'] ?? [];

        $nameIndex = [];
        foreach ($metaCampaigns as $cid => $campaign) {
            $nameIndex[$this->normalize($campaign['name'])] = (string) $cid;
        }

        // 1. Kelompokkan order beriklan per campaign, lalu per iklan (utm_content).
        $groups = [];
        foreach ($attributed as $row) {
            $key = (string) ($row->utm_campaign ?? '');
            $adKey = (string) ($row->utm_content ?? '');

            $groups[$key] ??= ['orders' => 0, 'revenue' => 0.0, 'sources' => [], 'ads' => []];
            $groups[$key]['orders'] += (int) $row->orders;
            $groups[$key]['revenue'] += (float) $row->revenue;
            if ($row->utm_source) {
                $groups[$key]['sources'][strtolower($row->utm_source)] = true;
            }

            $groups[$key]['ads'][$adKey] ??= ['orders' => 0, 'revenue' => 0.0];
            $groups[$key]['ads'][$adKey]['orders'] += (int) $row->orders;
            $groups[$key]['ads'][$adKey]['revenue'] += (float) $row->revenue;
        }

        // 2. Cocokkan ke campaign Meta: utm_campaign = ID Meta, atau (link statis Linktree) = nama campaign.
        $rows = [];
        $matchedCampaigns = [];

        foreach ($groups as $key => $group) {
            $cid = $this->matchCampaignId((string) $key, $metaCampaigns, $nameIndex);
            if ($cid !== null) {
                $matchedCampaigns[$cid] = true;
            }

            $rows[] = $this->buildRow(
                key: (string) $key,
                cid: $cid,
                group: $group,
                metaCampaign: $cid !== null ? $metaCampaigns[$cid] : null,
                currency: $currency,
            );
        }

        // 3. Campaign yang keluar biaya tapi belum menghasilkan order tetap harus terlihat.
        foreach ($metaCampaigns as $cid => $campaign) {
            $cid = (string) $cid;
            if (isset($matchedCampaigns[$cid]) || $campaign['spend'] <= 0) {
                continue;
            }

            $rows[] = $this->buildRow(
                key: $cid,
                cid: $cid,
                group: ['orders' => 0, 'revenue' => 0.0, 'sources' => ['meta' => true], 'ads' => []],
                metaCampaign: $campaign,
                currency: $currency,
            );
        }

        usort($rows, fn ($a, $b) => [$b['revenue'], $b['spend'] ?? 0] <=> [$a['revenue'], $a['spend'] ?? 0]);

        $adOrders = array_sum(array_column($rows, 'orders'));
        $adRevenue = array_sum(array_column($rows, 'revenue'));
        $totalSpend = $spend !== null ? array_sum(array_column($metaCampaigns, 'spend')) : null;

        return response()->json([
            'data' => [
                'range' => ['from' => $start->toDateString(), 'to' => $end->toDateString()],
                'spend_status' => $spendStatus,
                'spend_currency' => $currency,
                'totals' => [
                    'orders' => $totalOrders,
                    'revenue' => $totalRevenue,
                    'ad_orders' => $adOrders,
                    'ad_revenue' => (float) $adRevenue,
                    'direct_orders' => $totalOrders - $adOrders,
                    'direct_revenue' => $totalRevenue - (float) $adRevenue,
                    'spend' => $totalSpend,
                    'roas' => $this->roas((float) $adRevenue, $totalSpend, $currency),
                ],
                'campaigns' => $rows,
            ],
        ]);
    }

    /**
     * @param  array{orders: int, revenue: float, sources: array<string, bool>, ads: array<string, array{orders: int, revenue: float}>}  $group
     * @param  array{name: string, spend: float, ads: array<string, array{name: string, spend: float}>}|null  $metaCampaign
     * @return array<string, mixed>
     */
    private function buildRow(string $key, ?string $cid, array $group, ?array $metaCampaign, ?string $currency): array
    {
        $spend = $metaCampaign['spend'] ?? null;

        $metaAds = $metaCampaign['ads'] ?? [];
        $adNameIndex = [];
        foreach ($metaAds as $aid => $ad) {
            $adNameIndex[$this->normalize($ad['name'])] = (string) $aid;
        }

        $ads = [];
        $matchedAds = [];
        foreach ($group['ads'] as $adKey => $adGroup) {
            $adKey = (string) $adKey;
            $aid = null;
            if ($adKey !== '') {
                $aid = isset($metaAds[$adKey]) ? $adKey : ($adNameIndex[$this->normalize($adKey)] ?? null);
            }
            if ($aid !== null) {
                $matchedAds[$aid] = true;
            }

            $adSpend = $aid !== null ? $metaAds[$aid]['spend'] : null;
            $ads[] = [
                'key' => $adKey !== '' ? $adKey : null,
                'name' => $aid !== null ? $metaAds[$aid]['name'] : ($adKey !== '' ? $adKey : '(no ad)'),
                'orders' => $adGroup['orders'],
                'revenue' => $adGroup['revenue'],
                'spend' => $adSpend,
                'roas' => $this->roas($adGroup['revenue'], $adSpend, $currency),
            ];
        }

        // Iklan yang keluar biaya tapi belum ada order.
        foreach ($metaAds as $aid => $ad) {
            $aid = (string) $aid;
            if (isset($matchedAds[$aid]) || $ad['spend'] <= 0) {
                continue;
            }
            $ads[] = [
                'key' => $aid,
                'name' => $ad['name'],
                'orders' => 0,
                'revenue' => 0.0,
                'spend' => $ad['spend'],
                'roas' => $this->roas(0.0, $ad['spend'], $currency),
            ];
        }

        usort($ads, fn ($a, $b) => [$b['revenue'], $b['spend'] ?? 0] <=> [$a['revenue'], $a['spend'] ?? 0]);

        return [
            'key' => $key !== '' ? $key : null,
            'campaign_id' => $cid,
            'name' => $metaCampaign['name'] ?? ($key !== '' ? $key : '(no campaign)'),
            'sources' => array_keys($group['sources']),
            'orders' => $group['orders'],
            'revenue' => $group['revenue'],
            'spend' => $spend,
            'roas' => $this->roas($group['revenue'], $spend, $currency),
            'ads' => $ads,
        ];
    }

    /** @param array<int|string, array{name: string}> $metaCampaigns @param array<string, string> $nameIndex */
    private function matchCampaignId(string $key, array $metaCampaigns, array $nameIndex): ?string
    {
        if ($key === '') {
            return null;
        }

        if (isset($metaCampaigns[$key])) {
            return $key;
        }

        return $nameIndex[$this->normalize($key)] ?? null;
    }

    /** Nama campaign Meta ↔ UTM statis: abaikan huruf besar/kecil dan pemisah. */
    private function normalize(string $value): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($value)) ?? '', '-');
    }

    /** ROAS hanya bermakna kalau spend dalam IDR (mata uang revenue). */
    private function roas(float $revenue, ?float $spend, ?string $currency): ?float
    {
        if ($spend === null || $spend <= 0 || ($currency !== null && $currency !== 'IDR')) {
            return null;
        }

        return round($revenue / $spend, 2);
    }
}
