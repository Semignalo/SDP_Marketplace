<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $vendorId = $request->user()->vendor_id;

        $items = OrderItem::where('vendor_id', $vendorId);

        $revenue = (clone $items)
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed']))
            ->sum('subtotal');

        $ordersCount = (clone $items)
            ->select('order_id')->distinct()->count('order_id');

        $productsCount = Product::where('vendor_id', $vendorId)->count();
        $productsActive = Product::where('vendor_id', $vendorId)->where('status', 'active')->count();
        $productsLowStock = Product::where('vendor_id', $vendorId)->where('stock', '<', 5)->where('status', 'active')->count();

        // Top 5 products by quantity sold
        $top = OrderItem::where('vendor_id', $vendorId)
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed']))
            ->select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->with(['product:id,name,slug,price'])
            ->get();

        return response()->json([
            'data' => [
                'revenue' => (float) $revenue,
                'orders_count' => $ordersCount,
                'products_count' => $productsCount,
                'products_active' => $productsActive,
                'products_low_stock' => $productsLowStock,
                'top_products' => $top->map(fn ($t) => [
                    'product_id' => $t->product_id,
                    'name' => $t->product?->name,
                    'slug' => $t->product?->slug,
                    'qty_sold' => (int) $t->total_qty,
                    'revenue' => (float) $t->total_revenue,
                ]),
            ],
        ]);
    }

    public function revenueChart(Request $request): JsonResponse
    {
        $vendorId = $request->user()->vendor_id;
        $days = (int) $request->input('days', 30);
        $days = max(7, min(90, $days));

        $start = now()->subDays($days - 1)->startOfDay();

        $rows = OrderItem::where('vendor_id', $vendorId)
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed'])->where('created_at', '>=', $start))
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->select(DB::raw('DATE(orders.created_at) as date'), DB::raw('SUM(order_items.subtotal) as total'))
            ->groupBy('date')
            ->pluck('total', 'date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = now()->subDays($days - 1 - $i)->format('Y-m-d');
            $series[] = ['date' => $d, 'total' => (float) ($rows[$d] ?? 0)];
        }

        return response()->json(['data' => $series]);
    }
}
