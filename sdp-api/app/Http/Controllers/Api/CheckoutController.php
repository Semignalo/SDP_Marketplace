<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Models\User;
use App\Services\RajaOngkirService;
use App\Services\TierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
     * POST /api/checkout/shipping-rates — hitung ongkos kirim via RajaOngkir.
     */
    public function shippingRates(Request $request, RajaOngkirService $rajaOngkir): JsonResponse
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
            return response()->json(['message' => 'Alamat tidak ditemukan'], 404);
        }

        if (! $address->city_id) {
            return response()->json([
                'message' => 'Alamat belum punya city ID RajaOngkir. Perbarui alamat.',
                'data'    => [
                    'rates'             => RajaOngkirService::fallbackRates(),
                    'free_shipping_min' => (float) Setting::get('shipping_min_free', 150000),
                    'total_weight'      => 300,
                    'is_fallback'       => true,
                ],
            ], 422);
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

        $originCityId = (int) Setting::get('rajaongkir_origin_city_id', 23);
        $destCityId   = (int) $address->city_id;

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
     * POST /api/orders — create order from cart.
     */
    public function store(Request $request, TierService $tierService): JsonResponse
    {
        $data = $request->validate([
            'address_id' => 'nullable|integer|exists:addresses,id',
            'shipping_name' => 'required_without:address_id|string|max:120',
            'shipping_phone' => 'required_without:address_id|string|max:30',
            'shipping_address' => 'required_without:address_id|string|max:500',
            'courier' => 'nullable|string',
            'courier_name' => 'required|string|max:100',
            'shipping_cost' => 'required|integer|min:0',
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
        } else {
            $shippingName = $data['shipping_name'];
            $shippingPhone = $data['shipping_phone'];
            $shippingAddress = $data['shipping_address'];
        }

        // Referrer diambil dari profil user (ditetapkan saat register, permanen).
        $resellerId = $user->referrer_id ?: null;

        $requestedShippingCost = (int) $data['shipping_cost'];
        $courierName = $data['courier_name'];

        $order = DB::transaction(function () use ($data, $user, $shippingName, $shippingPhone, $shippingAddress, $courierName, $requestedShippingCost, $resellerId, $tierService) {
            // Lock & verify products.
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
                    throw ValidationException::withMessages([
                        'items' => "Produk tidak ditemukan",
                    ]);
                }
                if ($product->status !== 'active') {
                    throw ValidationException::withMessages([
                        'items' => "Produk {$product->name} tidak tersedia",
                    ]);
                }
                if ($product->stock < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} hanya tersisa {$product->stock}",
                    ]);
                }

                $unitPrice = (float) $product->price;
                $lineSubtotal = $unitPrice * $line['quantity'];
                $subtotalBeforeDiscount += $lineSubtotal;

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

            // Shipping cost — subsidi max Rp shipping_max_free jika subtotal >= threshold.
            $shippingMinFree = (float) Setting::get('shipping_min_free', 150000);
            $shippingMaxFree = (float) Setting::get('shipping_max_free', 20000);
            $shippingCost = $subtotal >= $shippingMinFree
                ? max(0, $requestedShippingCost - $shippingMaxFree)
                : $requestedShippingCost;
            $total = $subtotal + $shippingCost;

            $order = Order::create([
                'user_id' => $user->id,
                'reseller_id' => $resellerId,
                'order_number' => $this->generateOrderNumber(),
                'status' => 'pending_payment',
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'tier_discount' => $tierDiscount,
                'tier_name' => $tierName,
                'total' => $total,
                'shipping_name' => $shippingName,
                'shipping_phone' => $shippingPhone,
                'shipping_address' => $shippingAddress,
                'shipping_courier' => $courierName,
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

        return response()->json([
            'data' => new OrderResource($order),
            'message' => 'Pesanan berhasil dibuat',
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
