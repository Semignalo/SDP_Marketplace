<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Turunkan komisi reseller 10% -> 5%. Guard: hanya update kalau value saat ini masih '10',
     * supaya tidak menimpa perubahan manual admin yang mungkin sudah dilakukan lewat Settings.
     */
    public function up(): void
    {
        if (Setting::get('reseller_commission_rate', '10') === '10') {
            Setting::set('reseller_commission_rate', '5');
        }
    }

    public function down(): void
    {
        if (Setting::get('reseller_commission_rate', '5') === '5') {
            Setting::set('reseller_commission_rate', '10');
        }
    }
};
