<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
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
            ->with(['vendor', 'category', 'images'])
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

    public function show(string $slug)
    {
        $product = Product::query()
            ->active()
            ->with(['vendor', 'category', 'images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::query()
            ->active()
            ->with(['vendor', 'images'])
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
