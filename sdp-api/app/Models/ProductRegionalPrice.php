<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Override harga per negara. Selalu menang atas Product::price kalau ada untuk
 * negara yang sedang aktif — lihat Product::priceForCountry().
 */
class ProductRegionalPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'country_code',
        'price_idr',
        'input_currency',
        'input_amount',
        'input_rate_to_idr',
        'set_by_user_id',
    ];

    protected $casts = [
        'price_idr' => 'decimal:2',
        'input_amount' => 'decimal:2',
        'input_rate_to_idr' => 'decimal:6',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function setBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by_user_id');
    }
}
