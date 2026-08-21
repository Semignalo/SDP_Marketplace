<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_regional_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('country_code', 2);

            /*
             * Harga efektif untuk negara ini, SELALU dalam IDR — ini yang dipakai
             * checkout & Midtrans. Kalau admin/vendor input dalam mata uang asing,
             * angkanya dikonversi sekali lalu dibekukan di sini; tidak ikut naik-turun
             * mengikuti kurs, supaya harga tidak berubah sendiri tiap kurs bergerak.
             */
            $table->decimal('price_idr', 12, 2);

            // Jejak input asli — cuma untuk ditampilkan lagi ke admin/vendor saat mengedit.
            $table->string('input_currency', 3)->nullable();
            $table->decimal('input_amount', 14, 2)->nullable();
            $table->decimal('input_rate_to_idr', 18, 6)->nullable();

            $table->foreignId('set_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'country_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_regional_prices');
    }
};
