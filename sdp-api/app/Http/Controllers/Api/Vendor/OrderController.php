<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Mail\OrderShipped;
use App\Models\Order;
use App\Support\CourierTracking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:pending_payment,processing,shipped,completed,cancelled',
            'search' => 'nullable|string|max:50',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $vendorId = $request->user()->vendor_id;

        $query = Order::query()
            ->whereHas('items', fn ($q) => $q->where('vendor_id', $vendorId))
            ->with([
                'customer:id,name,email',
                'items' => fn ($q) => $q->where('vendor_id', $vendorId)->with('product:id,slug,name'),
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('order_number', 'like', "%{$s}%");
        }

        $orders = $query->paginate($request->input('per_page', 15))->withQueryString();

        $data = $orders->getCollection()->map(fn ($order) => $this->shape($order, $vendorId));

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $vendorId = $request->user()->vendor_id;

        $order = Order::where('order_number', $orderNumber)
            ->whereHas('items', fn ($q) => $q->where('vendor_id', $vendorId))
            ->with([
                'customer:id,name,email,phone',
                'items' => fn ($q) => $q->where('vendor_id', $vendorId)->with('product:id,slug,name'),
            ])
            ->firstOrFail();

        return response()->json(['data' => $this->shape($order, $vendorId, full: true)]);
    }

    public function updateTracking(Request $request, string $orderNumber): JsonResponse
    {
        $data = $request->validate([
            'tracking_number' => 'required|string|max:80',
            'mark_shipped' => 'nullable|boolean',
        ]);

        $vendorId = $request->user()->vendor_id;
        $order = Order::where('order_number', $orderNumber)
            ->whereHas('items', fn ($q) => $q->where('vendor_id', $vendorId))
            ->firstOrFail();

        $payload = ['tracking_number' => $data['tracking_number']];
        $marksShipped = ! empty($data['mark_shipped']) && $order->status === 'processing';
        if ($marksShipped) {
            $payload['status'] = 'shipped';
        }
        $order->update($payload);

        if ($marksShipped) {
            $this->sendOrderShippedEmail($order->fresh());
        }

        return response()->json(['message' => 'Tracking info updated', 'data' => ['status' => $order->status, 'tracking_number' => $order->tracking_number]]);
    }

    private function shape(Order $order, int $vendorId, bool $full = false): array
    {
        $vendorItems = $order->items->where('vendor_id', $vendorId);
        $vendorSubtotal = $vendorItems->sum('subtotal');

        $base = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'created_at' => $order->created_at?->toIso8601String(),
            'customer' => $order->customer ? [
                'name' => $order->customer->name,
                'email' => $order->customer->email,
            ] : null,
            'vendor_subtotal' => (float) $vendorSubtotal,
            'items_count' => $vendorItems->count(),
            'tracking_number' => $order->tracking_number,
            'tracking_url' => CourierTracking::url($order->shipping_courier),
            'shipping_courier' => $order->shipping_courier,
        ];

        if ($full) {
            $base['shipping_name'] = $order->shipping_name;
            $base['shipping_phone'] = $order->shipping_phone;
            $base['shipping_address'] = $order->shipping_address;
            $base['items'] = $vendorItems->values()->map(fn ($item) => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'product_slug' => $item->product?->slug,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
                'subtotal' => (float) $item->subtotal,
            ]);
        }

        return $base;
    }

    /**
     * Best-effort: kirim email pemberitahuan pesanan dikirim ke customer atau guest.
     */
    private function sendOrderShippedEmail(Order $order): void
    {
        try {
            if (! $order->user_id && $order->guest_email) {
                Mail::to($order->guest_email)->send(new OrderShipped($order));
                return;
            }

            if ($order->user_id) {
                $order->loadMissing('customer');
                if ($order->customer?->email) {
                    Mail::to($order->customer->email)->send(new OrderShipped($order));
                }
            }
        } catch (Throwable $e) {
            Log::warning('Order shipped email failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
