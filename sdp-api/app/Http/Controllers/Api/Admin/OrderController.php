<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Mail\OrderShipped;
use App\Mail\ShippingQuoteReady;
use App\Models\Order;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Support\CourierTracking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:50',
            'status' => 'nullable|in:pending_payment,awaiting_quote,processing,shipped,completed,cancelled',
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

    public function pendingCount(): JsonResponse
    {
        $count = Order::whereIn('status', ['awaiting_quote', 'processing'])->count();

        return response()->json(['data' => ['count' => $count]]);
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

    public function invoice(string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product.images', 'items.vendor'])
            ->firstOrFail();

        return response()->json(['data' => new OrderResource($order)]);
    }

    /**
     * GET /api/admin/orders/{orderNumber}/delivery-note — download PDF surat jalan (admin only, on-demand).
     */
    public function deliveryNote(string $orderNumber): Response
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.vendor'])
            ->firstOrFail();

        $settings = Setting::whereIn('key', ['site_name', 'site_tagline'])->pluck('value', 'key');

        $pdf = Pdf::loadView('pdf.delivery-note', [
            'order' => $order,
            'siteName' => $settings['site_name'] ?? 'SDP Marketplace',
            'siteTagline' => $settings['site_tagline'] ?? 'Multi-Brand Marketplace',
        ]);

        return $pdf->download("Surat-Jalan-{$order->order_number}.pdf");
    }

    // Transisi status yang diizinkan. Status terminal (completed, cancelled) tidak bisa diubah lagi.
    private const ALLOWED_TRANSITIONS = [
        'awaiting_quote'  => ['pending_payment', 'cancelled'],
        'pending_payment' => ['processing', 'cancelled'],
        'processing'      => ['shipped', 'cancelled'],
        'shipped'         => ['completed', 'cancelled'],
        'completed'       => [],
        'cancelled'       => ['processing'],
    ];

    public function updateStatus(Request $request, string $orderNumber): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending_payment,awaiting_quote,processing,shipped,completed,cancelled',
            'admin_notes' => 'nullable|string|max:500',
            'shipping_courier' => 'nullable|string|max:100',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        if ($data['status'] !== $order->status) {
            $allowed = self::ALLOWED_TRANSITIONS[$order->status] ?? [];
            if (! in_array($data['status'], $allowed)) {
                return response()->json([
                    'message' => "Can't change status from '{$order->status}' to '{$data['status']}'.",
                ], 422);
            }
        }

        $wasShipped = $order->status === 'shipped';

        DB::transaction(function () use ($data, $order) {
            $payload = ['status' => $data['status']];
            if (array_key_exists('admin_notes', $data)) {
                $payload['admin_notes'] = $data['admin_notes'];
            }
            if (array_key_exists('shipping_courier', $data)) {
                $payload['shipping_courier'] = $data['shipping_courier'];
            }
            if (array_key_exists('tracking_number', $data)) {
                $payload['tracking_number'] = $data['tracking_number'];
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

        if ($data['status'] === 'shipped' && ! $wasShipped) {
            $this->sendOrderShippedEmail($order->fresh());
        }

        return response()->json(['message' => 'Order status updated', 'data' => ['status' => $order->fresh()->status]]);
    }

    /**
     * Admin input ongkir manual untuk order awaiting_quote (international) lalu lanjut ke pending_payment.
     */
    public function setShippingQuote(Request $request, string $orderNumber): JsonResponse
    {
        $data = $request->validate([
            'shipping_cost' => 'required|integer|min:0',
            'shipping_courier' => 'nullable|string|max:100',
        ]);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        if ($order->status !== 'awaiting_quote') {
            return response()->json(['message' => 'This order is not awaiting a shipping quote'], 422);
        }

        DB::transaction(function () use ($data, $order) {
            $order->update([
                'shipping_cost' => $data['shipping_cost'],
                'shipping_courier' => $data['shipping_courier'] ?? $order->shipping_courier,
                'total' => (float) $order->subtotal + $data['shipping_cost'],
                'status' => 'pending_payment',
            ]);
        });

        $this->sendShippingQuoteReadyEmail($order->fresh());

        return response()->json(['message' => 'Shipping quote sent', 'data' => $this->shape($order->fresh())]);
    }

    private function shape(Order $o, bool $full = false): array
    {
        $base = [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'status' => $o->status,
            'subtotal' => (float) $o->subtotal,
            'shipping_cost' => (float) $o->shipping_cost,
            'shipping_country' => $o->shipping_country,
            'total' => (float) $o->total,
            'created_at' => $o->created_at?->toIso8601String(),
            'customer' => $o->customer ? ['id' => $o->customer->id, 'name' => $o->customer->name, 'email' => $o->customer->email] : null,
            'reseller' => $o->reseller ? ['id' => $o->reseller->id, 'name' => $o->reseller->name, 'reseller_code' => $o->reseller->reseller_code] : null,
            'shipping_courier' => $o->shipping_courier,
            'tracking_number' => $o->tracking_number,
            'tracking_url' => CourierTracking::url($o->shipping_courier),
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

    /**
     * Best-effort: kirim email pemberitahuan kuotasi ongkir siap & order bisa dibayar.
     */
    private function sendShippingQuoteReadyEmail(Order $order): void
    {
        try {
            if (! $order->user_id && $order->guest_email) {
                Mail::to($order->guest_email)->send(new ShippingQuoteReady($order));
                return;
            }

            if ($order->user_id) {
                $order->loadMissing('customer');
                if ($order->customer?->email) {
                    Mail::to($order->customer->email)->send(new ShippingQuoteReady($order));
                }
            }
        } catch (Throwable $e) {
            Log::warning('Shipping quote ready email failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
