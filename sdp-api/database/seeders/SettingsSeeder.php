<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'reseller_commission_rate'],
            ['value' => '5']
        );

        Setting::updateOrCreate(
            ['key' => 'app_name'],
            ['value' => 'SDP Marketplace']
        );
    }
}
