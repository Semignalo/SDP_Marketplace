<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,draft,archived',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Product::query()
            ->where('vendor_id', $request->user()->vendor_id)
            ->with(['category:id,name,slug', 'images'])
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $q = $request->input('search');
            $query->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return ProductResource::collection(
            $query->paginate($request->input('per_page', 15))->withQueryString()
        );
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorize($request, $product);
        $product->load(['images', 'category:id,name,slug']);
        return response()->json(['data' => new ProductResource($product)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:160',
            'slug' => 'nullable|string|max:180',
            'category_id' => 'required|integer|exists:categories,id',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:60',
            'status' => 'required|in:active,draft,archived',
            'images' => 'nullable|array|max:8',
            'images.*' => 'url|max:500',
        ]);

        $product = DB::transaction(function () use ($data, $request) {
            $product = Product::create([
                'vendor_id' => $request->user()->vendor_id,
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['slug'] ?: $data['name']),
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'stock' => $data['stock'],
                'sku' => $data['sku'] ?? null,
                'status' => $data['status'],
            ]);

            $this->syncImages($product, $data['images'] ?? []);
            return $product->fresh(['images', 'category:id,name,slug']);
        });

        return response()->json(['data' => new ProductResource($product), 'message' => 'Product added successfully'], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorize($request, $product);

        $data = $request->validate([
            'name' => 'required|string|max:160',
            'slug' => 'nullable|string|max:180',
            'category_id' => 'required|integer|exists:categories,id',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:60',
            'status' => 'required|in:active,draft,archived',
            'images' => 'nullable|array|max:8',
            'images.*' => 'url|max:500',
        ]);

        DB::transaction(function () use ($data, $product) {
            $payload = collect($data)->except('images')->toArray();
            if (! empty($data['slug']) && $data['slug'] !== $product->slug) {
                $payload['slug'] = $this->uniqueSlug($data['slug'], $product->id);
            } else {
                unset($payload['slug']);
            }
            $product->update($payload);

            if (array_key_exists('images', $data)) {
                $this->syncImages($product, $data['images'] ?? []);
            }
        });

        $product->load(['images', 'category:id,name,slug']);
        return response()->json(['data' => new ProductResource($product), 'message' => 'Product updated']);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorize($request, $product);
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    private function authorize(Request $request, Product $product): void
    {
        abort_unless($product->vendor_id === $request->user()->vendor_id, 403);
    }

    private function syncImages(Product $product, array $urls): void
    {
        $product->images()->delete();
        foreach (array_values(array_filter($urls)) as $i => $url) {
            ProductImage::create([
                'product_id' => $product->id,
                'url' => $url,
                'sort_order' => $i,
            ]);
        }
    }

    private function uniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $n = 1;
        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . (++$n);
        }
        return $slug;
    }
}
