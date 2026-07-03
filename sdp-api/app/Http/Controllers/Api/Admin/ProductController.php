<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ActivityLogger;
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
            'vendor_id' => 'nullable|integer|exists:vendors,id',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Product::query()
            ->with(['vendor:id,name,slug', 'category:id,name,slug', 'images'])
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->input('vendor_id'));
        }

        return ProductResource::collection(
            $query->paginate($request->input('per_page', 20))->withQueryString()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vendor_id'   => 'required|integer|exists:vendors,id',
            'name'        => 'required|string|max:160',
            'slug'        => 'nullable|string|max:180',
            'category_id' => 'required|integer|exists:categories,id',
            'description' => 'nullable|string|max:5000',
            'price'       => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0|gt:price',
            'stock'       => 'required|integer|min:0',
            'sku'         => 'nullable|string|max:60',
            'status'      => 'required|in:active,draft,archived',
            'images'      => 'nullable|array|max:8',
            'images.*'    => 'url|max:500',
        ]);

        $product = DB::transaction(function () use ($data) {
            $product = Product::create([
                'vendor_id'   => $data['vendor_id'],
                'category_id' => $data['category_id'],
                'name'        => $data['name'],
                'slug'        => $this->uniqueSlug(($data['slug'] ?? null) ?: $data['name']),
                'description' => $data['description'] ?? null,
                'price'       => $data['price'],
                'compare_at_price' => $data['compare_at_price'] ?? null,
                'stock'       => $data['stock'],
                'sku'         => $data['sku'] ?? null,
                'status'      => $data['status'],
            ]);
            $this->syncImages($product, $data['images'] ?? []);
            return $product->fresh(['images', 'category:id,name,slug', 'vendor:id,name,slug']);
        });

        ActivityLogger::log('admin.product', "Admin {$request->user()->name} menambah produk \"{$product->name}\"", $request->user(), $product);

        return response()->json(['data' => new ProductResource($product), 'message' => 'Product added successfully'], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'vendor_id'   => 'required|integer|exists:vendors,id',
            'name'        => 'required|string|max:160',
            'slug'        => 'nullable|string|max:180',
            'category_id' => 'required|integer|exists:categories,id',
            'description' => 'nullable|string|max:5000',
            'price'       => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0|gt:price',
            'stock'       => 'required|integer|min:0',
            'sku'         => 'nullable|string|max:60',
            'status'      => 'required|in:active,draft,archived',
            'images'      => 'nullable|array|max:8',
            'images.*'    => 'url|max:500',
        ]);

        $before = $product->only(['price', 'stock', 'status']);

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

        $product->load(['images', 'category:id,name,slug', 'vendor:id,name,slug']);

        ActivityLogger::log(
            'admin.product',
            "Admin {$request->user()->name} mengubah produk \"{$product->name}\"",
            $request->user(),
            $product,
            ['before' => $before, 'after' => $product->only(['price', 'stock', 'status'])]
        );

        return response()->json(['data' => new ProductResource($product), 'message' => 'Product updated']);
    }

    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:active,draft,archived',
        ]);
        $before = $product->status;
        $product->update($data);

        ActivityLogger::log(
            'admin.product',
            "Admin {$request->user()->name} mengubah status produk \"{$product->name}\" dari {$before} ke {$product->status}",
            $request->user(),
            $product
        );

        return response()->json(['message' => 'Product status updated', 'data' => ['id' => $product->id, 'status' => $product->status]]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $name = $product->name;
        $product->delete();

        ActivityLogger::log('admin.product', "Admin {$request->user()->name} menghapus produk \"{$name}\"", $request->user());

        return response()->json(['message' => 'Product deleted']);
    }

    private function syncImages(Product $product, array $urls): void
    {
        $product->images()->delete();
        foreach (array_values(array_filter($urls)) as $i => $url) {
            ProductImage::create(['product_id' => $product->id, 'url' => $url, 'sort_order' => $i]);
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
