<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Models\User;
use App\Services\MidtransService;
use App\Services\RajaOngkirService;
use App\Services\TierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class GuestCheckoutController extends Controller
{
    /**
     * POST /api/guest/shipping-rates — ongkir guest berdasarkan city_id langsung.
     */
    public function shippingRates(Request $request, RajaOngkirService $rajaOngkir): JsonResponse
    {
        $data = $request->validate([
            'city_id'            => 'required|integer',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $productIds = collect($data['items'])->pluck('product_id')->all();
        $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $totalWeight = 0;
        foreach ($data['items'] as $line) {
            $product = $products->get($line['product_id']);
            if ($product) {
                $totalWeight += ($product->weight_gram ?? 300) * $line['quantity'];
            }
        }
        $totalWeight = max(1, $totalWeight);

        $originCityId = (int) Setting::get('rajaongkir_origin_city_id', 23);
        $destCityId   = (int) $data['city_id'];

        $rates   = [];
        $hasLive = false;

        if ($rajaOngkir->isConfigured()) {
            $rates   = $rajaOngkir->getCost($originCityId, $destCityId, $totalWeight);
            $hasLive = count($rates) > 0;
        }

        if (! $hasLive) {
            $rates = RajaOngkirService::fallbackRates();
        }

        return response()->json([
            'data' => [
                'rates'             => $rates,
                'free_shipping_min' => (float) Setting::get('shipping_min_free', 150000),
                'free_shipping_max' => (float) Setting::get('shipping_max_free', 20000),
                'total_weight'      => $totalWeight,
                'is_fallback'       => ! $hasLive,
            ],
        ]);
    }

    /**
     * POST /api/guest/orders — buat order guest (tanpa login).
     */
    public function store(Request $request, TierService $tierService): JsonResponse
    {
        $data = $request->validate([
            'guest_email'      => 'required|email|max:160',
            'shipping_name'    => 'required|string|max:120',
            'shipping_phone'   => 'required|string|max:30',
            'shipping_address' => 'required|string|max:500',
            'shipping_country' => 'nullable|string|max:60',
            'courier_name'     => 'nullable|string|max:100',
            'shipping_cost'    => 'nullable|integer|min:0',
            'referral_code'    => 'nullable|string|max:40',
            'notes'            => 'nullable|string|max:500',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1|max:99',
        ]);

        $shippingCountry = $data['shipping_country'] ?? 'Indonesia';
        $isInternational = strcasecmp(trim($shippingCountry), 'Indonesia') !== 0;

        if (! $isInternational && empty($data['courier_name'])) {
            throw ValidationException::withMessages(['courier_name' => 'Please select a courier']);
        }

        // Resolve referral code → reseller (opsional). Kalau diisi tapi invalid → error.
        $referrer = null;
        $referralCode = ! empty($data['referral_code']) ? strtoupper(trim($data['referral_code'])) : null;
        if ($referralCode) {
            $referrer = User::where('reseller_code', $referralCode)->first();
            if (! $referrer) {
                throw ValidationException::withMessages([
                    'referral_code' => 'Referral code not found',
                ]);
            }
        }

        $requestedShippingCost = (int) ($data['shipping_cost'] ?? 0);
        $courierName = $isInternational ? null : $data['courier_name'];

        $order = DB::transaction(function () use ($data, $shippingCountry, $isInternational, $courierName, $referrer, $referralCode, $requestedShippingCost, $tierService) {
            $productIds = collect($data['items'])->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotalBeforeDiscount = 0;
            $orderItemsData = [];

            foreach ($data['items'] as $line) {
                $product = $products->get($line['product_id']);
                if (! $product) {
                    throw ValidationException::withMessages(['items' => 'Product not found']);
                }
                if ($product->status !== 'active') {
                    throw ValidationException::withMessages(['items' => "{$product->name} is not available"]);
                }
                if ($product->stock < $line['quantity']) {
                    throw ValidationException::withMessages(['items' => "Only {$product->stock} left in stock for {$product->name}"]);
                }

                $unitPrice = (float) $product->price;
                $lineSubtotal = $unitPrice * $line['quantity'];
                $subtotalBeforeDiscount += $lineSubtotal;

                $orderItemsData[] = [
                    'product'  => $product,
                    'price'    => $unitPrice,
                    'quantity' => $line['quantity'],
                    'subtotal' => $lineSubtotal,
                ];
            }

            // Guest dapat diskon tier Silver (level 2) — sama dengan tier minimum user terdaftar.
            $tierResult = $tierService->applyDiscount($subtotalBeforeDiscount, null);
            $subtotal = $tierResult['subtotal_after'];
            $tierDiscount = $tierResult['discount'];
            $tierName = $tierResult['tier']['name'] ?? null;

            if ($isInternational) {
                $shippingCost = 0;
                $total = $subtotal;
            } else {
                $shippingMinFree = (float) Setting::get('shipping_min_free', 150000);
                $shippingMaxFree = (float) Setting::get('shipping_max_free', 20000);
                $shippingCost = $subtotal >= $shippingMinFree
                    ? max(0, $requestedShippingCost - $shippingMaxFree)
                    : $requestedShippingCost;
                $total = $subtotal + $shippingCost;
            }

            $order = Order::create([
                'user_id'          => null,
                'guest_email'      => $data['guest_email'],
                'guest_token'      => Str::random(48),
                'reseller_id'      => $referrer?->id,
                'referral_code'    => $referrer ? $referralCode : null,
                'order_number'     => $this->generateOrderNumber(),
                'status'           => $isInternational ? 'awaiting_quote' : 'pending_payment',
                'subtotal'         => $subtotal,
                'shipping_cost'    => $shippingCost,
                'tier_discount'    => $tierDiscount,
                'tier_name'        => $tierName,
                'total'            => $total,
                'shipping_name'    => $data['shipping_name'],
                'shipping_phone'   => $data['shipping_phone'],
                'shipping_address' => $data['shipping_address'],
                'shipping_country' => $shippingCountry,
                'shipping_courier' => $courierName,
            ]);

            foreach ($orderItemsData as $line) {
                /** @var Product $product */
                $product = $line['product'];

                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $product->id,
                    'vendor_id'    => $product->vendor_id,
                    'product_name' => $product->name,
                    'price'        => $line['price'],
                    'quantity'     => $line['quantity'],
                    'subtotal'     => $line['subtotal'],
                ]);

                $product->decrement('stock', $line['quantity']);
            }

            // Komisi reseller (pending sampai order completed).
            if ($referrer) {
                $rate = (float) Setting::get('reseller_commission_rate', 10);
                ResellerCommission::create([
                    'reseller_id' => $referrer->id,
                    'order_id'    => $order->id,
                    'customer_id' => null,
                    'guest_name'  => $data['shipping_name'],
                    'guest_email' => $data['guest_email'],
                    'order_total' => $subtotal,
                    'rate'        => $rate,
                    'amount'      => round($subtotal * $rate / 100, 2),
                    'status'      => 'pending',
                ]);
            }

            return $order->load(['items.product.images', 'items.vendor']);
        });

        // Kirim email konfirmasi + link tracking (best-effort).
        try {
            Mail::to($order->guest_email)->send(new OrderConfirmation($order));
        } catch (Throwable $e) {
            Log::warning('Guest order confirmation email failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'data'        => new OrderResource($order),
            'guest_token' => $order->guest_token,
            'message'     => 'Order placed successfully',
        ], 201);
    }

    /**
     * POST /api/guest/orders/{orderNumber}/snap-token — token Midtrans untuk guest.
     */
    public function snapToken(Request $request, string $orderNumber, MidtransService $midtrans): JsonResponse
    {
        $order = $this->resolveGuestOrder($orderNumber, $request);

        if ($order->status !== 'pending_payment') {
            return response()->json(['message' => 'This order is not awaiting payment'], 422);
        }

        if (! $midtrans->isConfigured()) {
            return response()->json([
                'message'    => 'Midtrans is not configured yet. Contact the admin to set up the payment gateway.',
                'configured' => false,
            ], 503);
        }

        try {
            $token = $midtrans->getSnapToken($order);
            return response()->json([
                'data' => [
                    'token'         => $token,
                    'client_key'    => config('midtrans.client_key'),
                    'is_production' => (bool) config('midtrans.is_production'),
                ],
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        } catch (Throwable $e) {
            Log::error('Guest snap token failed', ['order' => $orderNumber, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to generate payment token: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/guest/orders/{orderNumber}/check-status — sinkron status dari Midtrans.
     */
    public function checkStatus(Request $request, string $orderNumber, MidtransService $midtrans): JsonResponse
    {
        $order = $this->resolveGuestOrder($orderNumber, $request);

        if ($order->status !== 'pending_payment') {
            return response()->json(['data' => ['status' => $order->status]]);
        }

        try {
            $result = $midtrans->checkTransactionStatus($orderNumber);
        } catch (Throwable $e) {
            return response()->json(['data' => ['status' => $order->status]]);
        }

        $next = $result['next_status'];
        if ($next) {
            DB::transaction(function () use ($order, $next, $result) {
                $payload = ['status' => $next];
                if ($next === 'processing') {
                    $payload['payment_verified_at']    = now();
                    $payload['payment_transaction_id'] = $result['transaction_id'] ?? null;
                    $payload['payment_type']           = $result['payment_type'] ?? null;
                    $payload['payment_channel']        = $result['payment_channel'] ?? null;
                    $payload['payment_gross_amount']   = $result['gross_amount'] ?? null;
                }
                $order->update($payload);

                $commission = ResellerCommission::where('order_id', $order->id)->first();
                if ($commission && $next === 'cancelled' && in_array($commission->status, ['pending', 'earned'])) {
                    $commission->update(['status' => 'cancelled']);
                }
            });
        }

        return response()->json(['data' => ['status' => $order->fresh()->status]]);
    }

    /**
     * POST /api/guest/orders/resend-link — kirim ulang link lacak ke email guest.
     * Selalu balas pesan generik agar tidak bisa dipakai enumerasi order/email.
     */
    public function resendLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_number' => 'required|string|max:40',
            'guest_email'  => 'required|email|max:160',
        ]);

        $order = Order::where('order_number', strtoupper(trim($data['order_number'])))
            ->whereNull('user_id')
            ->where('guest_email', $data['guest_email'])
            ->first();

        if ($order) {
            try {
                Mail::to($order->guest_email)->send(new OrderConfirmation($order));
            } catch (Throwable $e) {
                Log::warning('Resend guest tracking link failed', [
                    'order' => $order->order_number,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'If the order number and email match, a tracking link has been resent to your email.',
        ]);
    }

    /**
     * GET /api/guest/orders/{orderNumber}?token=XXX — tracking detail order guest.
     */
    public function track(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->resolveGuestOrder($orderNumber, $request);
        $order->load(['items.product.images', 'items.vendor']);

        return response()->json(['data' => new OrderResource($order)]);
    }

    /**
     * Cari guest order & verifikasi guest_token. 404 kalau tidak cocok.
     */
    private function resolveGuestOrder(string $orderNumber, Request $request): Order
    {
        $token = (string) ($request->query('token') ?: $request->input('token') ?: $request->header('X-Guest-Token', ''));

        $order = Order::where('order_number', $orderNumber)
            ->whereNull('user_id')
            ->firstOrFail();

        if (! $token || ! hash_equals((string) $order->guest_token, $token)) {
            abort(403, 'Invalid token');
        }

        return $order;
    }

    private function generateOrderNumber(): string
    {
        do {
            $code = 'SDP-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));
        } while (Order::where('order_number', $code)->exists());

        return $code;
    }
}
