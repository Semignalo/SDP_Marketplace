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
        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->string('country', 60);
            $table->string('country_code', 3)->nullable();
            $table->string('zone', 60)->nullable();
            $table->decimal('weight_kg', 6, 2);
            $table->decimal('length_cm', 6, 1)->nullable();
            $table->decimal('width_cm', 6, 1)->nullable();
            $table->decimal('height_cm', 6, 1)->nullable();
            $table->string('service', 20);
            $table->string('term', 10);
            $table->unsignedInteger('base_rate');
            $table->decimal('fsc_percent', 5, 2)->default(10);
            $table->unsignedInteger('esc_amount')->default(0);
            $table->unsignedInteger('add_fee_custom')->default(0);
            $table->unsignedInteger('ogb_fee')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['country_code', 'zone', 'weight_kg', 'length_cm', 'width_cm', 'height_cm', 'service', 'term'],
                'shipping_rates_lookup_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_rates');
    }
};
