<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Request $request, string $slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();

        $reviews = $product->reviews()
            ->with('user:id,name')
            ->latest()
            ->paginate($request->input('per_page', 10));

        return ReviewResource::collection($reviews)->additional([
            'meta_extra' => [
                'rating_avg' => round((float) $product->reviews()->avg('rating'), 1) ?: null,
                'reviews_count' => $product->reviews()->count(),
            ],
        ]);
    }

    public function eligibility(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $orderId = $user->orders()
            ->where('status', 'completed')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->whereDoesntHave('reviews', fn ($q) => $q->where('product_id', $product->id))
            ->oldest()
            ->value('id');

        return response()->json([
            'eligible' => (bool) $orderId,
            'order_id' => $orderId,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'order_id' => 'required|integer|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $order = $user->orders()
            ->where('id', $data['order_id'])
            ->where('status', 'completed')
            ->whereHas('items', fn ($q) => $q->where('product_id', $data['product_id']))
            ->first();

        if (! $order) {
            throw ValidationException::withMessages([
                'order_id' => 'Order not found or not yet eligible for review.',
            ]);
        }

        if ($order->reviews()->where('product_id', $data['product_id'])->exists()) {
            throw ValidationException::withMessages([
                'order_id' => 'You already reviewed this product for that order.',
            ]);
        }

        $review = Review::create([
            'product_id' => $data['product_id'],
            'user_id' => $user->id,
            'order_id' => $order->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        $review->load('user:id,name');

        return response()->json([
            'data' => new ReviewResource($review),
            'message' => 'Review submitted successfully',
        ], 201);
    }
}
