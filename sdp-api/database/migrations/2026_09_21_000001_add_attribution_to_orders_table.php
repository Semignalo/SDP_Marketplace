<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Atribusi iklan (last-touch, jendela 7 hari) — diisi saat order dibuat.
            $table->string('utm_source', 191)->nullable()->after('referral_code');
            $table->string('utm_medium', 191)->nullable()->after('utm_source');
            $table->string('utm_campaign', 191)->nullable()->after('utm_medium');
            $table->string('utm_content', 191)->nullable()->after('utm_campaign');
            $table->string('utm_term', 191)->nullable()->after('utm_content');
            $table->string('fbclid', 255)->nullable()->after('utm_term');
            $table->string('fbc', 255)->nullable()->after('fbclid');
            $table->string('fbp', 255)->nullable()->after('fbc');
            $table->string('landing_url', 500)->nullable()->after('fbp');
            // Waktu klik iklan terakhir (dari browser). Null = tidak ada atribusi iklan.
            $table->timestamp('attributed_at')->nullable()->after('landing_url');
            // Konteks browser untuk Conversions API — webhook Midtrans tidak punya ini.
            $table->string('client_ip', 45)->nullable()->after('attributed_at');
            $table->string('client_user_agent', 500)->nullable()->after('client_ip');
            // Idempotensi Purchase CAPI: terisi setelah event terkirim.
            $table->timestamp('capi_purchase_sent_at')->nullable()->after('client_user_agent');

            $table->index('utm_campaign');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['utm_campaign']);
            $table->dropColumn([
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'fbclid', 'fbc', 'fbp', 'landing_url', 'attributed_at',
                'client_ip', 'client_user_agent', 'capi_purchase_sent_at',
            ]);
        });
    }
};
