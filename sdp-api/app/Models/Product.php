<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'compare_at_price',
        'stock',
        'weight_gram',
        'sku',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'stock' => 'integer',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->orderBy('sort_order');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function regionalPrices(): HasMany
    {
        return $this->hasMany(ProductRegionalPrice::class);
    }

    /**
     * Harga dasar (IDR) yang berlaku untuk negara tertentu: override regional kalau ada,
     * kalau tidak ya harga default produk. Selalu IDR — penagihan tidak pernah pindah mata uang.
     *
     * Untuk listing, eager-load dulu relasinya agar tidak N+1:
     *   ->with(['regionalPrices' => fn ($q) => $q->where('country_code', $code)])
     */
    public function effectivePriceIdr(?string $countryCode): float
    {
        $base = (float) $this->price;

        if ($countryCode === null || ! in_array($countryCode, config('regions.pricing_countries', []), true)) {
            return $base;
        }

        $override = $this->relationLoaded('regionalPrices')
            ? $this->regionalPrices->firstWhere('country_code', $countryCode)
            : $this->regionalPrices()->where('country_code', $countryCode)->first();

        return $override ? (float) $override->price_idr : $base;
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
