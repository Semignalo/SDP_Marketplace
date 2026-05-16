<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $revenue = Order::whereIn('status', ['processing', 'shipped', 'completed'])->sum('total');
        $ordersCount = Order::count();
        $ordersPending = Order::where('status', 'pending_payment')->count();
        $aov = $ordersCount > 0 ? $revenue / max(1, Order::whereIn('status', ['processing', 'shipped', 'completed'])->count()) : 0;

        $top_vendors = OrderItem::query()
            ->select('vendor_id', DB::raw('SUM(subtotal) as revenue'), DB::raw('SUM(quantity) as qty'))
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed']))
            ->groupBy('vendor_id')
            ->orderByDesc('revenue')
            ->limit(5)
            ->with('vendor:id,name,slug,logo')
            ->get()
            ->map(fn ($r) => [
                'vendor_id' => $r->vendor_id,
                'name' => $r->vendor?->name,
                'slug' => $r->vendor?->slug,
                'logo' => $r->vendor?->logo,
                'revenue' => (float) $r->revenue,
                'qty' => (int) $r->qty,
            ]);

        $top_products = OrderItem::query()
            ->select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(subtotal) as revenue'))
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed']))
            ->groupBy('product_id')
            ->orderByDesc('qty')
            ->limit(5)
            ->with('product:id,slug,name,vendor_id')
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->product?->name,
                'slug' => $r->product?->slug,
                'qty' => (int) $r->qty,
                'revenue' => (float) $r->revenue,
            ]);

        return response()->json([
            'data' => [
                'revenue' => (float) $revenue,
                'orders_count' => $ordersCount,
                'orders_pending' => $ordersPending,
                'aov' => (float) $aov,
                'users_count' => User::where('role', 'customer')->count(),
                'referrers_count' => User::where('role', 'customer')->whereNotNull('reseller_code')->count(),
                'vendors_count' => Vendor::where('status', 'active')->count(),
                'products_count' => Product::where('status', 'active')->count(),
                'top_vendors' => $top_vendors,
                'top_products' => $top_products,
            ],
        ]);
    }

    public function revenueChart(Request $request): JsonResponse
    {
        $days = max(7, min(90, (int) $request->input('days', 30)));
        $start = now()->subDays($days - 1)->startOfDay();

        $rows = Order::query()
            ->whereIn('status', ['processing', 'shipped', 'completed'])
            ->where('created_at', '>=', $start)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as orders'))
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = now()->subDays($days - 1 - $i)->format('Y-m-d');
            $row = $rows[$d] ?? null;
            $series[] = [
                'date' => $d,
                'total' => (float) ($row->total ?? 0),
                'orders' => (int) ($row->orders ?? 0),
            ];
        }

        return response()->json(['data' => $series]);
    }
}
