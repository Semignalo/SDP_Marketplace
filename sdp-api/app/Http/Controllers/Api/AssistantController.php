<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoint read-only buat asisten personal (OpenClaw).
 *
 * ATURAN: controller ini HANYA boleh baca. Jangan pernah tambah method yang
 * ubah/hapus data di sini — kalau asisten butuh aksi tulis, bikin jalur terpisah
 * dengan auth yang lebih ketat, jangan numpang token statis ini.
 *
 * PII sengaja dibatasi ke nama saja — email/telepon/alamat tidak diekspos,
 * karena ini cuma buat ringkasan tanya-jawab.
 */
class AssistantController extends Controller
{
    /** Status yang dianggap sudah dibayar. */
    private const PAID_STATUSES = ['processing', 'shipped', 'completed'];

    public function summary(): JsonResponse
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $statusCounts = Order::query()
            ->select('status', DB::raw('count(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status');

        $threshold = (int) config('services.assistant.low_stock_threshold', 5);

        return response()->json([
            'data' => [
                'generated_at' => now()->toIso8601String(),

                'today' => [
                    'orders' => Order::where('created_at', '>=', $today)->count(),
                    'revenue' => (float) Order::where('created_at', '>=', $today)
                        ->whereIn('status', self::PAID_STATUSES)->sum('total'),
                ],

                'this_month' => [
                    'orders' => Order::where('created_at', '>=', $monthStart)->count(),
                    'revenue' => (float) Order::where('created_at', '>=', $monthStart)
                        ->whereIn('status', self::PAID_STATUSES)->sum('total'),
                ],

                'orders_by_status' => $statusCounts,

                // Yang butuh aksi admin — ini biasanya inti pertanyaannya.
                'needs_action' => [
                    'awaiting_quote' => Order::where('status', 'awaiting_quote')->count(),
                    'pending_payment' => Order::where('status', 'pending_payment')->count(),
                    'processing' => Order::where('status', 'processing')->count(),
                ],

                'awaiting_quote_orders' => Order::where('status', 'awaiting_quote')
                    ->with('customer:id,name')
                    ->orderBy('created_at')
                    ->limit(20)
                    ->get()
                    ->map(fn ($o) => [
                        'order_number' => $o->order_number,
                        'customer' => $o->customer?->name ?? $o->shipping_name,
                        'country' => $o->shipping_country,
                        'subtotal' => (float) $o->subtotal,
                        'waiting_since' => $o->created_at?->toIso8601String(),
                        'waiting_hours' => $o->created_at ? (int) $o->created_at->diffInHours(now()) : null,
                    ]),

                'low_stock' => Product::where('status', 'active')
                    ->where('stock', '<=', $threshold)
                    ->orderBy('stock')
                    ->limit(20)
                    ->get(['id', 'name', 'sku', 'stock'])
                    ->map(fn ($p) => [
                        'name' => $p->name,
                        'sku' => $p->sku,
                        'stock' => $p->stock,
                    ]),
                'low_stock_threshold' => $threshold,
            ],
        ]);
    }

    /** Cari order — buat pertanyaan tipe "order X gimana statusnya". */
    public function orders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => 'nullable|string|max:50',
            'status' => 'nullable|in:pending_payment,awaiting_quote,processing,shipped,completed,cancelled',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Order::query()->with('customer:id,name')->orderByDesc('created_at');

        if (! empty($data['search'])) {
            $s = $data['search'];
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                    ->orWhere('shipping_name', 'like', "%{$s}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$s}%"));
            });
        }
        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $orders = $query->limit($data['limit'] ?? 10)->get();

        return response()->json([
            'data' => $orders->map(fn ($o) => [
                'order_number' => $o->order_number,
                'status' => $o->status,
                'customer' => $o->customer?->name ?? $o->shipping_name,
                'country' => $o->shipping_country,
                'total' => (float) $o->total,
                'tracking_number' => $o->tracking_number,
                'created_at' => $o->created_at?->toIso8601String(),
            ]),
        ]);
    }
}
