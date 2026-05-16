<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['customer', 'vendor_admin', 'admin'])->default('customer')->after('email');
            $table->string('reseller_code', 12)->nullable()->unique()->after('role');
            $table->foreignId('referrer_id')->nullable()->constrained('users')->nullOnDelete()->after('reseller_code');
            $table->string('phone', 20)->nullable()->after('referrer_id');
            $table->text('address')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referrer_id']);
            $table->dropColumn(['role', 'reseller_code', 'referrer_id', 'phone', 'address']);
        });
    }
};
