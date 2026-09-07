<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Alokasi stok terpisah per negara — pool INDEPENDEN dari Product::stock (global).
 * Didecrement tiap ada order dari negara ini, direstore ke sini juga saat order
 * dibatalkan/expired. Lihat Product::availableQtyFor().
 */
class ProductRegionalStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'country_code',
        'allocated_qty',
        'remaining_qty',
        'set_by_user_id',
    ];

    protected $casts = [
        'allocated_qty' => 'integer',
        'remaining_qty' => 'integer',
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
