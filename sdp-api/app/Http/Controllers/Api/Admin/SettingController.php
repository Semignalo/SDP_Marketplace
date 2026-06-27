<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Daftar setting keys yang dikenali admin panel.
     * Format: key => ['label', 'type' (text|number|textarea), 'group']
     */
    private const KNOWN_KEYS = [
        'site_name' => ['Site Name', 'text', 'Brand'],
        'site_tagline' => ['Tagline', 'text', 'Brand'],
        'reseller_commission_rate' => ['Referral Commission Rate (%)', 'number', 'Commission'],
        'shipping_min_free' => ['Minimum Spend for Free Shipping (Rp)', 'number', 'Shipping'],
        'shipping_max_free' => ['Maximum Shipping Subsidy (Rp)', 'number', 'Shipping'],
        'shipping_flat_default' => ['Default Flat Shipping Rate (Rp)', 'number', 'Shipping'],
        'rajaongkir_origin_city_id' => ['Origin City (RajaOngkir ID)', 'number', 'Shipping'],
        'announce_bar_1' => ['Announce Bar 1', 'text', 'Appearance'],
        'announce_bar_2' => ['Announce Bar 2', 'text', 'Appearance'],
        'whatsapp_cs' => ['WhatsApp CS', 'text', 'Contact'],
        'email_cs' => ['CS Email', 'text', 'Contact'],
        'social_instagram' => ['Instagram URL', 'text', 'Contact'],
        'social_facebook' => ['Facebook URL', 'text', 'Contact'],
        'bank_name' => ['Bank Name', 'text', 'Payment'],
        'bank_account_number' => ['Account Number', 'text', 'Payment'],
        'bank_account_name' => ['Account Holder Name', 'text', 'Payment'],
        'usd_idr_rate' => ['USD to IDR Rate (1 USD = ? Rp, display estimate)', 'number', 'Payment'],

        // Tier Loyalty (5 tiers × 3 fields) — fully customizable by admin
        'tier_1_name' => ['Tier 1 — Name', 'text', 'Tier Loyalty'],
        'tier_1_min_spend' => ['Tier 1 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_1_discount' => ['Tier 1 — Discount (%)', 'number', 'Tier Loyalty'],
        'tier_2_name' => ['Tier 2 — Name', 'text', 'Tier Loyalty'],
        'tier_2_min_spend' => ['Tier 2 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_2_discount' => ['Tier 2 — Discount (%)', 'number', 'Tier Loyalty'],
        'tier_3_name' => ['Tier 3 — Name', 'text', 'Tier Loyalty'],
        'tier_3_min_spend' => ['Tier 3 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_3_discount' => ['Tier 3 — Discount (%)', 'number', 'Tier Loyalty'],
        'tier_4_name' => ['Tier 4 — Name', 'text', 'Tier Loyalty'],
        'tier_4_min_spend' => ['Tier 4 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_4_discount' => ['Tier 4 — Discount (%)', 'number', 'Tier Loyalty'],
        'tier_5_name' => ['Tier 5 — Name', 'text', 'Tier Loyalty'],
        'tier_5_min_spend' => ['Tier 5 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_5_discount' => ['Tier 5 — Discount (%)', 'number', 'Tier Loyalty'],
        'tier_max_discount_rupiah' => ['Max Tier Discount per Order (Rp, 0 = no limit)', 'number', 'Tier Loyalty'],
    ];

    public function index(): JsonResponse
    {
        $stored = Setting::pluck('value', 'key');
        $data = [];

        foreach (self::KNOWN_KEYS as $key => [$label, $type, $group]) {
            $data[] = [
                'key' => $key,
                'value' => $stored[$key] ?? '',
                'label' => $label,
                'type' => $type,
                'group' => $group,
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array|min:1',
            'settings.*.key' => 'required|string|max:64',
            'settings.*.value' => 'nullable|string|max:2000',
        ]);

        foreach ($data['settings'] as $row) {
            if (! array_key_exists($row['key'], self::KNOWN_KEYS)) {
                continue;
            }
            Setting::set($row['key'], (string) ($row['value'] ?? ''));
        }

        return response()->json(['message' => 'Pengaturan disimpan']);
    }
}
