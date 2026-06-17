<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop FK dulu agar bisa ubah user_id jadi nullable (guest checkout)
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('guest_email')->nullable()->after('user_id');
            // Token akses tracking guest order tanpa login (dikirim via email)
            $table->string('guest_token', 64)->nullable()->unique()->after('guest_email');
            // Kode referral yang dipakai saat checkout (guest / manual input)
            $table->string('referral_code', 40)->nullable()->after('reseller_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['guest_token']);
            $table->dropColumn(['guest_email', 'guest_token', 'referral_code']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
