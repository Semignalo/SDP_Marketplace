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
            $table->string('payment_transaction_id')->nullable()->after('payment_verified_at');
            $table->string('payment_type')->nullable()->after('payment_transaction_id');
            $table->string('payment_channel')->nullable()->after('payment_type');
            $table->decimal('payment_gross_amount', 12, 2)->nullable()->after('payment_channel');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_transaction_id', 'payment_type', 'payment_channel', 'payment_gross_amount']);
        });
    }
};
