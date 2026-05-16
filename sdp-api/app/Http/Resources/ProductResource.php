<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->when($this->shouldShowDescription($request), $this->description),
            'price' => (float) $this->price,
            'stock' => $this->stock,
            'sku' => $this->sku,
            'status' => $this->status,
            'in_stock' => $this->stock > 0,
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
}
