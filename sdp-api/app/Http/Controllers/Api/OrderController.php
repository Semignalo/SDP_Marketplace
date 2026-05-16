<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:pending_payment,processing,shipped,completed,cancelled',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Order::query()
            ->where('user_id', $request->user()->id)
            ->withCount('items')
            ->with(['items' => fn ($q) => $q->limit(1)])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $orders = $query->paginate($request->input('per_page', 10))->withQueryString();
        return OrderResource::collection($orders);
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->with(['items.product.images', 'items.vendor'])
            ->firstOrFail();

        return response()->json(['data' => new OrderResource($order)]);
    }
}
