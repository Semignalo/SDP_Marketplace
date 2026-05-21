<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ResellerCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:50',
            'status' => 'nullable|in:pending_payment,processing,shipped,completed,cancelled',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Order::query()
            ->with(['customer:id,name,email', 'reseller:id,name,reseller_code'])
            ->withCount('items')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('order_number', 'like', "%{$s}%");
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $orders = $query->paginate($request->input('per_page', 20))->withQueryString();

        return response()->json([
            'data' => collect($orders->items())->map(fn ($o) => $this->shape($o)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with([
                'customer:id,name,email,phone',
                'reseller:id,name,reseller_code',
                'items.product:id,slug,name',
                'items.vendor:id,name,slug',
                'commission',
            ])
            ->firstOrFail();

        return response()->json(['data' => $this->shape($order, full: true)]);
    }

    // Transisi status yang diizinkan. Status terminal (completed, cancelled) tidak bisa diubah lagi.
    private const ALLOWED_TRANSITIONS = [
        'pending_payment' => ['processing', 'cancelled'],
        'processing'      => ['shipped', 'cancelled'],
        'shipped'         => ['completed', 'cancelled'],
        'completed'       => [],
        'cancelled'       => [],
    ];

    public function updateStatus(Request $request, string $orderNumber): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending_payment,processing,shipped,completed,cancelled',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $allowed = self::ALLOWED_TRANSITIONS[$order->status] ?? [];
        if (! in_array($data['status'], $allowed)) {
            return response()->json([
                'message' => "Tidak bisa ubah status dari '{$order->status}' ke '{$data['status']}'.",
            ], 422);
        }

        DB::transaction(function () use ($data, $order) {
            $payload = ['status' => $data['status']];
            if (array_key_exists('admin_notes', $data)) {
                $payload['admin_notes'] = $data['admin_notes'];
            }
            if (in_array($data['status'], ['processing', 'shipped', 'completed']) && ! $order->payment_verified_at) {
                $payload['payment_verified_at'] = now();
            }
            $order->update($payload);

            $commission = ResellerCommission::where('order_id', $order->id)->first();
            if ($commission) {
                if ($data['status'] === 'completed' && $commission->status === 'pending') {
                    $commission->update(['status' => 'earned']);
                } elseif ($data['status'] === 'cancelled' && in_array($commission->status, ['pending', 'earned'])) {
                    $commission->update(['status' => 'cancelled']);
                }
            }
        });

        return response()->json(['message' => 'Status pesanan diperbarui', 'data' => ['status' => $order->fresh()->status]]);
    }

    private function shape(Order $o, bool $full = false): array
    {
        $base = [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'status' => $o->status,
            'subtotal' => (float) $o->subtotal,
            'shipping_cost' => (float) $o->shipping_cost,
            'total' => (float) $o->total,
            'created_at' => $o->created_at?->toIso8601String(),
            'customer' => $o->customer ? ['id' => $o->customer->id, 'name' => $o->customer->name, 'email' => $o->customer->email] : null,
            'reseller' => $o->reseller ? ['id' => $o->reseller->id, 'name' => $o->reseller->name, 'reseller_code' => $o->reseller->reseller_code] : null,
            'shipping_courier' => $o->shipping_courier,
            'tracking_number' => $o->tracking_number,
            'items_count' => $o->items_count ?? $o->items?->count() ?? 0,
        ];

        if ($full) {
            $base['shipping_name'] = $o->shipping_name;
            $base['shipping_phone'] = $o->shipping_phone;
            $base['shipping_address'] = $o->shipping_address;
            $base['payment_verified_at'] = $o->payment_verified_at?->toIso8601String();
            $base['payment_transaction_id'] = $o->payment_transaction_id;
            $base['payment_type'] = $o->payment_type;
            $base['payment_channel'] = $o->payment_channel;
            $base['payment_gross_amount'] = $o->payment_gross_amount ? (float) $o->payment_gross_amount : null;
            $base['admin_notes'] = $o->admin_notes;
            $base['items'] = $o->items->map(fn ($item) => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'product_slug' => $item->product?->slug,
                'vendor' => $item->vendor ? ['id' => $item->vendor->id, 'name' => $item->vendor->name, 'slug' => $item->vendor->slug] : null,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
                'subtotal' => (float) $item->subtotal,
            ]);
            $base['commission'] = $o->commission ? [
                'id' => $o->commission->id,
                'amount' => (float) $o->commission->amount,
                'rate' => (float) $o->commission->rate,
                'status' => $o->commission->status,
            ] : null;
        }

        return $base;
    }
}
