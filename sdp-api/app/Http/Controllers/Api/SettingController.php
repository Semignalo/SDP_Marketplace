<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;

class SettingController extends Controller
{
    protected array $publicKeys = [
        'site_name',
        'site_tagline',
        'shipping_min_free',
        'shipping_flat_default',
        'tier_max_discount_rupiah',
        'announce_bar_1',
        'announce_bar_2',
        'whatsapp_cs',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'social_instagram',
        'social_facebook',
        'email_cs',
    ];

    public function publicIndex()
    {
        $settings = Setting::whereIn('key', $this->publicKeys)
            ->pluck('value', 'key')
            ->toArray();

        $settings['midtrans_client_key'] = (string) config('midtrans.client_key');
        $settings['midtrans_is_production'] = (bool) config('midtrans.is_production');

        return response()->json(['data' => $settings]);
    }
}
