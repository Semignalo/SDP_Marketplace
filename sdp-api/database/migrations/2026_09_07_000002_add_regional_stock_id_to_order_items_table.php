<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Null = decrement diambil dari products.stock (global, behavior lama).
            // Terisi = decrement diambil dari pool product_regional_stocks ini —
            // dipakai restore stock (cancel/expired) supaya balik ke pool yang benar.
            // nullOnDelete (bukan cascade): kalau override-nya dihapus, order_item
            // historis tetap ada, cuma kehilangan link (lihat catatan restore stock).
            $table->foreignId('product_regional_stock_id')->nullable()
                ->after('product_id')
                ->constrained('product_regional_stocks')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_regional_stock_id');
        });
    }
};
