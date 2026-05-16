<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'reseller_commission_rate' => '10',
            'shipping_min_free' => '150000',
            'shipping_flat_default' => '15000',
            'site_name' => 'SDP Marketplace',
            'site_tagline' => 'Marketplace multi-brand pilihan kamu',
            'announce_bar_1' => 'Gratis Ongkir min. Rp 150.000',
            'announce_bar_2' => 'Brand baru hadir setiap minggu',
            'whatsapp_cs' => '+6281234567890',

            // Tier Loyalty — 5 tier × 3 field
            'tier_1_name' => 'Member',   'tier_1_min_spend' => '5000000',  'tier_1_discount' => '10',
            'tier_2_name' => 'Silver',   'tier_2_min_spend' => '10000000', 'tier_2_discount' => '15',
            'tier_3_name' => 'Gold',     'tier_3_min_spend' => '15000000', 'tier_3_discount' => '20',
            'tier_4_name' => 'Platinum', 'tier_4_min_spend' => '20000000', 'tier_4_discount' => '25',
            'tier_5_name' => 'VIP',      'tier_5_min_spend' => '25000000', 'tier_5_discount' => '30',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
