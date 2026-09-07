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

    public function regionalStocks(): HasMany
    {
        return $this->hasMany(ProductRegionalStock::class);
    }

    /**
     * Baris alokasi stok untuk negara tertentu, atau null kalau negara ini TIDAK
     * punya override sama sekali (bukan sama dengan "override ada tapi 0").
     */
    public function regionalStockFor(?string $countryCode): ?ProductRegionalStock
    {
        if ($countryCode === null) {
            return null;
        }

        return $this->relationLoaded('regionalStocks')
            ? $this->regionalStocks->firstWhere('country_code', $countryCode)
            : $this->regionalStocks()->where('country_code', $countryCode)->first();
    }

    /**
     * Qty yang boleh dibeli customer di $countryCode SEKARANG.
     * - Tidak ada override -> ikut stock global, tanpa batas (behavior lama, tidak berubah).
     * - Ada override -> remaining_qty pool itu yang berlaku, INDEPENDEN dari stock global
     *   (products.stock tidak pernah ikut dikurangi/dibatasi oleh angka ini).
     */
    public function availableQtyFor(?string $countryCode): int
    {
        $override = $this->regionalStockFor($countryCode);

        return $override ? (int) $override->remaining_qty : (int) $this->stock;
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
