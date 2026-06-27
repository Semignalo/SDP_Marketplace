<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => $this->shape($c));

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'slug' => 'nullable|string|max:100|unique:categories,slug',
            'parent_id' => 'nullable|integer|exists:categories,id',
            'sort_order' => 'nullable|integer|min:0|max:999',
        ]);

        $category = Category::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?: $this->uniqueSlug($data['name']),
            'parent_id' => $data['parent_id'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json(['message' => 'Category created', 'data' => $this->shape($category->loadCount('products'))], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:80',
            'slug' => 'sometimes|string|max:100|unique:categories,slug,' . $category->id,
            'parent_id' => 'nullable|integer|exists:categories,id',
            'sort_order' => 'nullable|integer|min:0|max:999',
        ]);

        if (! empty($data['parent_id']) && $data['parent_id'] === $category->id) {
            return response()->json(['message' => 'Tidak bisa jadi parent dirinya sendiri', 'errors' => ['parent_id' => ['Invalid']]], 422);
        }

        $category->update($data);
        return response()->json(['message' => 'Category updated', 'data' => $this->shape($category->loadCount('products'))]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->children()->exists()) {
            return response()->json(['message' => 'Delete the subcategories first before deleting the parent'], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }

    private function shape(Category $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'parent_id' => $c->parent_id,
            'sort_order' => $c->sort_order ?? 0,
            'products_count' => $c->products_count ?? 0,
        ];
    }

    private function uniqueSlug(string $source): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $n = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $base . '-' . (++$n);
        }
        return $slug;
    }
}
