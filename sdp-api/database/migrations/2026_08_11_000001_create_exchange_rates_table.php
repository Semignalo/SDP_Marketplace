<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('currency_code', 3)->unique();

            /*
             * Berapa Rupiah untuk 1 unit currency ini (mis. AUD => ~10500).
             * Disimpan sebagai "IDR per 1 unit" (bukan sebaliknya) supaya konversi
             * IDR -> lokal = harga / rate_to_idr, dan angkanya enak dibaca manusia.
             */
            $table->decimal('rate_to_idr', 18, 6);

            $table->string('source', 40)->default('open.er-api.com');
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
