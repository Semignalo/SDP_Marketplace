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
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Resolve rentang tanggal dari request: date_from/date_to eksplisit (menang), atau 'days' terakhir
     * (default 30). Dipakai bareng oleh summary() & revenueChart() biar filter dashboard konsisten.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveDateRange(Request $request): array
    {
        $data = $request->validate([
            'all' => 'nullable|boolean',
            'days' => 'nullable|integer|min:1|max:366',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $end = now()->startOfDay();
        // Batas pengaman absolut biar loop generate series gak kebablasan (10 tahun cukup jauh).
        $maxSpanDays = 3650;

        if ($request->boolean('all')) {
            $earliest = Order::whereNull('archived_at')->oldest('created_at')->value('created_at');
            $start = $earliest ? Carbon::parse($earliest)->startOfDay() : $end->copy()->subDays(30);
            if ($start->diffInDays($end) > $maxSpanDays) {
                $start = $end->copy()->subDays($maxSpanDays);
            }
        } elseif (! empty($data['date_from']) && ! empty($data['date_to'])) {
            $start = Carbon::parse($data['date_from'])->startOfDay();
            $end = Carbon::parse($data['date_to'])->startOfDay();
            // Batasi maks 1 tahun biar gak query/loop kebablasan kalau ada input tanggal aneh.
            if ($start->diffInDays($end) > 366) {
                $start = $end->copy()->subDays(366);
            }
        } else {
            $days = max(1, min(366, (int) ($data['days'] ?? 30)));
            $start = $end->copy()->subDays($days - 1);
        }

        return [$start, $end];
    }

    public function summary(Request $request): JsonResponse
    {
        [$start, $end] = $this->resolveDateRange($request);

        $inRange = fn () => Order::whereDate('created_at', '>=', $start)->whereDate('created_at', '<=', $end);
        $qualifyingInRange = fn () => $inRange()->whereIn('status', ['processing', 'shipped', 'completed'])->whereNull('archived_at');

        $revenue = $qualifyingInRange()->sum('total');
        // Breakdown: shipping_cost akurat di semua order (baru maupun hasil migrasi legacy),
        // tapi kolom subtotal TIDAK — order legacy nyimpen subtotal SEBELUM diskon (tier_discount-nya
        // persen, bukan rupiah), beda sama order baru yang subtotal-nya udah bersih. Jadi revenue produk
        // dihitung mundur dari total (yang selalu akurat di kedua jenis order), bukan dari subtotal.
        $revenueShipping = $qualifyingInRange()->sum('shipping_cost');
        $revenueProducts = $revenue - $revenueShipping;
        // Total Orders & AOV ikut filter tanggal (order dibuat dalam rentang).
        $ordersCount = $inRange()->whereNull('archived_at')->count();
        $qualifyingCount = $qualifyingInRange()->count();
        $aov = $qualifyingCount > 0 ? $revenue / $qualifyingCount : 0;

        // Awaiting Payment sengaja TIDAK ikut filter tanggal — ini alert operasional "butuh aksi
        // sekarang", bukan statistik historis. Order pending lama harus tetap kelihatan.
        $ordersPending = Order::where('status', 'pending_payment')->whereNull('archived_at')->count();

        $top_vendors = OrderItem::query()
            ->select('vendor_id', DB::raw('SUM(subtotal) as revenue'), DB::raw('SUM(quantity) as qty'))
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed'])
                ->whereNull('archived_at')
                ->whereDate('created_at', '>=', $start)
                ->whereDate('created_at', '<=', $end))
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
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['processing', 'shipped', 'completed'])
                ->whereNull('archived_at')
                ->whereDate('created_at', '>=', $start)
                ->whereDate('created_at', '<=', $end))
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
                'revenue_products' => (float) $revenueProducts,
                'revenue_shipping' => (float) $revenueShipping,
                'orders_count' => $ordersCount,
                'orders_pending' => $ordersPending,
                'aov' => (float) $aov,
                // Total keseluruhan / status aktif saat ini — sengaja gak ikut filter tanggal,
                // karena bukan konsep "kejadian dalam rentang waktu".
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
        [$rangeStart, $rangeEnd] = $this->resolveDateRange($request);

        $rows = Order::query()
            ->whereIn('status', ['processing', 'shipped', 'completed'])
            ->whereNull('archived_at')
            ->whereDate('created_at', '>=', $rangeStart)
            ->whereDate('created_at', '<=', $rangeEnd)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as total'),
                DB::raw('SUM(shipping_cost) as shipping'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $series = [];
        $cursor = $rangeStart->copy();
        while ($cursor->lte($rangeEnd)) {
            $d = $cursor->format('Y-m-d');
            $row = $rows[$d] ?? null;
            $total = (float) ($row->total ?? 0);
            $shipping = (float) ($row->shipping ?? 0);
            $series[] = [
                'date' => $d,
                'total' => $total,
                // shipping_cost akurat di semua order; product revenue dihitung mundur dari total
                // karena kolom subtotal gak konsisten antara order baru & hasil migrasi legacy.
                'products' => $total - $shipping,
                'shipping' => $shipping,
                'orders' => (int) ($row->orders ?? 0),
            ];
            $cursor->addDay();
        }

        return response()->json(['data' => $series]);
    }
}
