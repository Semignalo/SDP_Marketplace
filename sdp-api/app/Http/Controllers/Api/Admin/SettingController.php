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
        'site_name' => ['Nama Situs', 'text', 'Brand'],
        'site_tagline' => ['Tagline', 'text', 'Brand'],
        'reseller_commission_rate' => ['Rate Komisi Referral (%)', 'number', 'Komisi'],
        'shipping_min_free' => ['Minimum Gratis Ongkir (Rp)', 'number', 'Pengiriman'],
        'shipping_flat_default' => ['Ongkir Flat Default (Rp)', 'number', 'Pengiriman'],
        'announce_bar_1' => ['Announce Bar 1', 'text', 'Tampilan'],
        'announce_bar_2' => ['Announce Bar 2', 'text', 'Tampilan'],
        'whatsapp_cs' => ['WhatsApp CS', 'text', 'Kontak'],

        // Tier Loyalty (5 tier × 3 field) — admin bisa custom semua
        'tier_1_name' => ['Tier 1 — Nama', 'text', 'Tier Loyalty'],
        'tier_1_min_spend' => ['Tier 1 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_1_discount' => ['Tier 1 — Diskon (%)', 'number', 'Tier Loyalty'],
        'tier_2_name' => ['Tier 2 — Nama', 'text', 'Tier Loyalty'],
        'tier_2_min_spend' => ['Tier 2 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_2_discount' => ['Tier 2 — Diskon (%)', 'number', 'Tier Loyalty'],
        'tier_3_name' => ['Tier 3 — Nama', 'text', 'Tier Loyalty'],
        'tier_3_min_spend' => ['Tier 3 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_3_discount' => ['Tier 3 — Diskon (%)', 'number', 'Tier Loyalty'],
        'tier_4_name' => ['Tier 4 — Nama', 'text', 'Tier Loyalty'],
        'tier_4_min_spend' => ['Tier 4 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_4_discount' => ['Tier 4 — Diskon (%)', 'number', 'Tier Loyalty'],
        'tier_5_name' => ['Tier 5 — Nama', 'text', 'Tier Loyalty'],
        'tier_5_min_spend' => ['Tier 5 — Min Spend (Rp)', 'number', 'Tier Loyalty'],
        'tier_5_discount' => ['Tier 5 — Diskon (%)', 'number', 'Tier Loyalty'],
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
