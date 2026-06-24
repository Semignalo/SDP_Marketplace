<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending_payment', 'awaiting_quote', 'processing', 'shipped', 'completed', 'cancelled'])
                ->default('pending_payment')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('orders')->where('status', 'awaiting_quote')->update(['status' => 'pending_payment']);

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled'])
                ->default('pending_payment')
                ->change();
        });
    }
};
