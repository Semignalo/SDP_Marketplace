<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_regional_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // ISO-2, dari daftar dunia (config/countries.php) — BUKAN dibatasi ke
            // 4 pricing_countries seperti product_regional_prices.
            $table->string('country_code', 2);

            // Angka yang terakhir diinput admin/vendor ("set stok negara ini jadi N").
            $table->unsignedInteger('allocated_qty');

            // Pool yang sungguhan didecrement tiap ada order dari negara ini,
            // independen dari products.stock. 0 = tidak bisa dipesan dari negara ini.
            $table->unsignedInteger('remaining_qty');

            $table->foreignId('set_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'country_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_regional_stocks');
    }
};
