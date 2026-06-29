<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Mail\OrderConfirmation;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Models\User;
use App\Services\ShippingZoneService;
use App\Services\TierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class CheckoutController extends Controller
{
    /**
     * GET /api/checkout/options — free shipping threshold.
     */
    public function options(TierService $tierService): JsonResponse
    {
        $guestTier = $tierService->tierByLevel(2);

        return response()->json([
            'data' => [
                'shipping_min_free' => (float) Setting::get('shipping_min_free', 150000),
                'shipping_max_free' => (float) Setting::get('shipping_max_free', 20000),
                'tier_max_discount_rupiah' => (float) Setting::get('tier_max_discount_rupiah', 0),
                'guest_tier' => $guestTier,
            ],
        ]);
    }

    /**
     * POST /api/checkout/shipping-rates — hitung ongkir flat berdasarkan zona provinsi tujuan.
     */
    public function shippingRates(Request $request, ShippingZoneService $zoneService): JsonResponse
    {
        $data = $request->validate([
            'address_id' => 'required|integer|exists:addresses,id',
            'items'      => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $user    = $request->user();
        $address = Address::where('user_id', $user->id)->find($data['address_id']);

        if (! $address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        // Hitung total berat
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

        $quote = $zoneService->quote($address->province, $totalWeight);

        return response()->json([
            'data' => [
                'cost'              => $quote['cost'],
                'requires_manual'   => $quote['requires_manual'],
                'zone_label'        => $quote['label'],
                'free_shipping_min' => (float) Setting::get('shipping_min_free', 150000),
                'free_shipping_max' => (float) Setting::get('shipping_max_free', 20000),
                'total_weight'      => $totalWeight,
            ],
        ]);
    }

    /**
     * POST /api/orders — create order from cart.
     */
    public function store(Request $request, TierService $tierService, ShippingZoneService $zoneService): JsonResponse
    {
        $data = $request->validate([
            'address_id' => 'nullable|integer|exists:addresses,id',
            'shipping_name' => 'required_without:address_id|string|max:120',
            'shipping_phone' => 'required_without:address_id|string|max:30',
            'shipping_address' => 'required_without:address_id|string|max:500',
            'shipping_country' => 'nullable|string|max:60',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
        ]);

        $user = $request->user();

        // Resolve shipping info: address_id wins, else inline.
        if (! empty($data['address_id'])) {
            $address = Address::where('user_id', $user->id)->findOrFail($data['address_id']);
            $shippingName = $address->recipient_name;
            $shippingPhone = $address->phone;
            $shippingAddress = trim("{$address->address}, {$address->city} {$address->postal_code}");
            $shippingCountry = $address->country ?: 'Indonesia';
            $shippingProvince = $address->province;
        } else {
            $shippingName = $data['shipping_name'];
            $shippingPhone = $data['shipping_phone'];
            $shippingAddress = $data['shipping_address'];
            $shippingCountry = $data['shipping_country'] ?? 'Indonesia';
            $shippingProvince = null;
        }

        $isInternational = strcasecmp(trim($shippingCountry), 'Indonesia') !== 0;

        // Referrer diambil dari profil user (ditetapkan saat register, permanen).
        $resellerId = $user->referrer_id ?: null;

        $order = DB::transaction(function () use ($data, $user, $shippingName, $shippingPhone, $shippingAddress, $shippingCountry, $shippingProvince, $isInternational, $resellerId, $tierService, $zoneService) {
            // Lock & verify products.
            $productIds = collect($data['items'])->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotalBeforeDiscount = 0;
            $totalWeight = 0;
            $orderItemsData = [];

            foreach ($data['items'] as $line) {
                $product = $products->get($line['product_id']);
                if (! $product) {
                    throw ValidationException::withMessages([
                        'items' => "Product not found",
                    ]);
                }
                if ($product->status !== 'active') {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name} is not available",
                    ]);
                }
                if ($product->stock < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Only {$product->stock} left in stock for {$product->name}",
                    ]);
                }

                $unitPrice = (float) $product->price;
                $lineSubtotal = $unitPrice * $line['quantity'];
                $subtotalBeforeDiscount += $lineSubtotal;
                $totalWeight += ($product->weight_gram ?? 300) * $line['quantity'];

                $orderItemsData[] = [
                    'product' => $product,
                    'price' => $unitPrice,
                    'quantity' => $line['quantity'],
                    'subtotal' => $lineSubtotal,
                ];
            }

            // Apply tier discount ke subtotal (sebelum shipping calc).
            $tierResult = $tierService->applyDiscount($subtotalBeforeDiscount, $user);
            $subtotal = $tierResult['subtotal_after'];
            $tierDiscount = $tierResult['discount'];
            $tierName = $tierResult['tier']['name'] ?? null;

            // Ongkir dihitung server-side dari zona provinsi tujuan (flat rate), bukan input client.
            $zoneQuote = $isInternational ? null : $zoneService->quote($shippingProvince, max(1, $totalWeight));
            $needsManualQuote = $isInternational || ($zoneQuote['requires_manual'] ?? false);

            if ($needsManualQuote) {
                // Ongkir belum bisa dihitung otomatis (internasional, atau zona Maluku/Papua) —
                // order ditahan di awaiting_quote sampai admin input ongkir manual.
                $shippingCost = 0;
                $total = $subtotal;
            } else {
                // Shipping cost — subsidi max Rp shipping_max_free jika subtotal >= threshold.
                $shippingMinFree = (float) Setting::get('shipping_min_free', 150000);
                $shippingMaxFree = (float) Setting::get('shipping_max_free', 20000);
                $flatCost = (int) $zoneQuote['cost'];
                $shippingCost = $subtotal >= $shippingMinFree
                    ? max(0, $flatCost - $shippingMaxFree)
                    : $flatCost;
                $total = $subtotal + $shippingCost;
            }

            $order = Order::create([
                'user_id' => $user->id,
                'reseller_id' => $resellerId,
                'order_number' => $this->generateOrderNumber(),
                'status' => $needsManualQuote ? 'awaiting_quote' : 'pending_payment',
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'tier_discount' => $tierDiscount,
                'tier_name' => $tierName,
                'total' => $total,
                'shipping_name' => $shippingName,
                'shipping_phone' => $shippingPhone,
                'shipping_address' => $shippingAddress,
                'shipping_country' => $shippingCountry,
                'shipping_province' => $shippingProvince,
                'shipping_courier' => null,
            ]);

            foreach ($orderItemsData as $line) {
                /** @var Product $product */
                $product = $line['product'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'vendor_id' => $product->vendor_id,
                    'product_name' => $product->name,
                    'price' => $line['price'],
                    'quantity' => $line['quantity'],
                    'subtotal' => $line['subtotal'],
                ]);

                $product->decrement('stock', $line['quantity']);
            }

            // Reseller commission (status pending sampai order completed).
            if ($resellerId) {
                $rate = (float) Setting::get('reseller_commission_rate', 10);
                ResellerCommission::create([
                    'reseller_id' => $resellerId,
                    'order_id' => $order->id,
                    'customer_id' => $user->id,
                    'order_total' => $subtotal,
                    'rate' => $rate,
                    'amount' => round($subtotal * $rate / 100, 2),
                    'status' => 'pending',
                ]);
            }

            return $order->load(['items.product.images', 'items.vendor']);
        });

        try {
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (Throwable $e) {
            Log::warning('Order confirmation email failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'data' => new OrderResource($order),
            'message' => 'Order placed successfully',
        ], 201);
    }

    private function generateOrderNumber(): string
    {
        do {
            $code = 'SDP-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));
        } while (Order::where('order_number', $code)->exists());

        return $code;
    }
}
