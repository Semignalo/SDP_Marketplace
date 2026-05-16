<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:active,draft,archived',
        ]);
        $product->update($data);
        return response()->json(['message' => 'Status produk diperbarui', 'data' => ['id' => $product->id, 'status' => $product->status]]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Produk dihapus']);
    }
}
