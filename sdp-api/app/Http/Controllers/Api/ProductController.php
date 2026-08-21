<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRegion;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\TierService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ResolvesRegion;

    public function __construct(private TierService $tierService)
    {
    }

    /**
     * Eager-load override harga HANYA untuk negara yang aktif — satu query tambahan
     * untuk seluruh halaman, bukan per-produk.
     */
    private function regionalPriceEagerLoad(?string $country): array
    {
        if ($country === null) {
            return [];
        }

        return ['regionalPrices' => fn ($q) => $q->where('country_code', $country)];
    }

    /**
     * Hitung tier efektif user (atau guest = Silver) SEKALI per-request dan simpan di request
     * attributes, supaya ProductResource tidak perlu query ulang per-produk untuk harga member.
     * Diskon tier tidak berlaku untuk region di luar Indonesia — samakan dengan checkout,
     * biar harga member yang ditampilkan di listing tidak menjanjikan diskon yang
     * hilang lagi begitu customer checkout ke alamat internasional.
     */
    private function attachTierContext(Request $request, ?string $country): void
    {
        $tier = $country === 'ID' ? $this->tierService->resolveTierForUser($request->user('sanctum')) : null;
        $request->attributes->set('tier_discount_percent', (float) ($tier['discount'] ?? 0));
        $request->attributes->set('tier_name', $tier['name'] ?? null);
    }

    public function index(Request $request)
    {
        $country = $this->attachRegionContext($request);
        $this->attachTierContext($request, $country);

        $validated = $request->validate([
            'country' => 'nullable|string|size:2',
            'category' => 'nullable|string',
            'vendor' => 'nullable|string',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'search' => 'nullable|string|max:160',
            'sort' => 'nullable|in:newest,oldest,price_asc,price_desc,name_asc',
            'per_page' => 'nullable|integer|min:1|max:60',
            'featured' => 'nullable|boolean',
        ]);

        $query = Product::query()
            ->active()
            ->with(['vendor', 'category', 'images', ...$this->regionalPriceEagerLoad($country)])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        if (!empty($validated['category'])) {
            $category = Category::where('slug', $validated['category'])->first();
            if ($category) {
                $childIds = $category->children()->pluck('id')->all();
                $ids = array_merge([$category->id], $childIds);
                $query->whereIn('category_id', $ids);
            }
        }

        if (!empty($validated['vendor'])) {
            $query->whereHas('vendor', fn ($q) => $q->where('slug', $validated['vendor']));
        }

        if (isset($validated['min_price'])) {
            $query->where('price', '>=', $validated['min_price']);
        }

        if (isset($validated['max_price'])) {
            $query->where('price', '<=', $validated['max_price']);
        }

        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhereHas('vendor', fn ($v) => $v->where('name', 'like', "%{$term}%"));
            });
        }

        /*
         * Catatan: filter min/max price dan sort by price masih memakai kolom `price`
         * (harga dasar), bukan override regional. Untuk produk yang punya override,
         * urutan & filter bisa sedikit meleset dari harga yang tampil. Menyamakannya
         * butuh join ke product_regional_prices — belum dikerjakan karena override
         * diperkirakan cuma dipakai di sebagian kecil produk.
         */
        $sort = $validated['sort'] ?? 'newest';
        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $perPage = $validated['per_page'] ?? 20;
        $products = $query->paginate($perPage)->withQueryString();

        return ProductResource::collection($products);
    }

    public function show(string $slug, Request $request)
    {
        $country = $this->attachRegionContext($request);
        $this->attachTierContext($request, $country);
        $regionalLoad = $this->regionalPriceEagerLoad($country);

        $product = Product::query()
            ->active()
            ->with(['vendor', 'category', 'images', ...$regionalLoad])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::query()
            ->active()
            ->with(['vendor', 'images', ...$regionalLoad])
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($product) {
                $q->where('category_id', $product->category_id)
                  ->orWhere('vendor_id', $product->vendor_id);
            })
            ->limit(8)
            ->get();

        return response()->json([
            'data' => new ProductResource($product),
            'related' => ProductResource::collection($related),
        ]);
    }
}
