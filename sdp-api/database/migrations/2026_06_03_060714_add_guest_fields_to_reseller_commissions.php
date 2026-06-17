<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Komisi bisa berasal dari guest order (tanpa customer_id)
        Schema::table('reseller_commissions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
        });

        Schema::table('reseller_commissions', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->change();
            $table->foreign('customer_id')->references('id')->on('users')->nullOnDelete();

            // Identitas guest (untuk ditampilkan di dashboard reseller)
            $table->string('guest_name')->nullable()->after('customer_id');
            $table->string('guest_email')->nullable()->after('guest_name');
        });
    }

    public function down(): void
    {
        Schema::table('reseller_commissions', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_email']);
        });

        Schema::table('reseller_commissions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->foreignId('customer_id')->nullable(false)->change();
            $table->foreign('customer_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
