<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $items = $request->user()
            ->wishlists()
            ->with(['product.vendor', 'product.images'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($w) => $w->product)
            ->filter();

        return ProductResource::collection($items);
    }

    public function toggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $user = $request->user();
        $existing = $user->wishlists()->where('product_id', $data['product_id'])->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['in_wishlist' => false]);
        }

        $user->wishlists()->create(['product_id' => $data['product_id']]);
        return response()->json(['in_wishlist' => true]);
    }

    public function ids(Request $request): JsonResponse
    {
        $ids = $request->user()->wishlists()->pluck('product_id');
        return response()->json(['data' => $ids]);
    }
}
