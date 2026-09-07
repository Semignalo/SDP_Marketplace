<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductRegionalStock;
use App\Models\ResellerCommission;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function cancel(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->firstOrFail();

        if ($order->status !== 'pending_payment') {
            return response()->json(['message' => 'This order cannot be cancelled'], 422);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_regional_stock_id) {
                    ProductRegionalStock::where('id', $item->product_regional_stock_id)
                        ->increment('remaining_qty', $item->quantity);
                } else {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            ResellerCommission::where('order_id', $order->id)
                ->whereIn('status', ['pending', 'earned'])
                ->update(['status' => 'cancelled']);

            $order->update(['status' => 'cancelled']);
        });

        ActivityLogger::log(
            'order',
            "Order {$order->order_number} dibatalkan oleh {$request->user()->name}",
            $request->user(),
            $order
        );

        return response()->json(['message' => 'Order cancelled successfully']);
    }
}
