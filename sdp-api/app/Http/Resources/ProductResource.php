<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $country = $request->attributes->get('region_country');
        $effectivePrice = $this->effectivePriceIdr($country);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->when($this->shouldShowDescription($request), $this->description),
            // Harga yang berlaku untuk region ini (IDR) — sudah termasuk override regional.
            'price' => $effectivePrice,
            // Harga default produk, buat referensi kalau ada override yang berlaku.
            'base_price' => (float) $this->price,
            'regional_price_applied' => $effectivePrice !== (float) $this->price,
            'region_country' => $country,
            'compare_at_price' => $this->compare_at_price !== null ? (float) $this->compare_at_price : null,
            'member_price' => $this->calculateMemberPrice($request, $effectivePrice),
            'tier_discount_percent' => (float) $request->attributes->get('tier_discount_percent', 0),
            'tier_name' => $request->attributes->get('tier_name'),
            'stock' => $this->stock,
            'sku' => $this->sku,
            'status' => $this->status,
            'in_stock' => $this->stock > 0,
            'rating_avg' => $this->reviews_avg_rating !== null ? round((float) $this->reviews_avg_rating, 1) : null,
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'primary_image' => $this->whenLoaded('images', fn () => optional($this->images->first())->url),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    protected function shouldShowDescription(Request $request): bool
    {
        return $request->routeIs('products.show');
    }

    /**
     * Harga akhir setelah diskon tier (Silver minimum untuk guest, lihat TierService::resolveTierForUser()).
     * Cap tier_max_discount_rupiah TIDAK disimulasikan di sini — itu berlaku per-order saat checkout,
     * bukan per-produk saat browsing, jadi total belanja besar bisa sedikit lebih tinggi dari SUM harga
     * member per-item yang ditampilkan di listing.
     */
    protected function calculateMemberPrice(Request $request, float $basePrice): float
    {
        $percent = (float) $request->attributes->get('tier_discount_percent', 0);
        if ($percent <= 0) {
            return $basePrice;
        }

        return round($basePrice * (1 - $percent / 100), 2);
    }
}
