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
use App\Services\TierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    /**
     * Hardcoded courier options. Replace dengan RajaOngkir nanti jika perlu live rate.
     */
    public static function couriers(): array
    {
        return [
            ['code' => 'jne_reg',   'name' => 'JNE',     'service' => 'REG',    'cost' => 18000, 'eta' => '2-3 hari'],
            ['code' => 'jne_yes',   'name' => 'JNE',     'service' => 'YES',    'cost' => 28000, 'eta' => '1 hari'],
            ['code' => 'jnt_reg',   'name' => 'J&T',     'service' => 'EZ',     'cost' => 16000, 'eta' => '2-3 hari'],
            ['code' => 'sicepat',   'name' => 'SiCepat', 'service' => 'REG',    'cost' => 15000, 'eta' => '2-3 hari'],
            ['code' => 'anteraja',  'name' => 'AnterAja','service' => 'REG',    'cost' => 14000, 'eta' => '2-4 hari'],
            ['code' => 'pos_kilat', 'name' => 'POS',     'service' => 'Kilat',  'cost' => 12000, 'eta' => '3-5 hari'],
        ];
    }

    /**
     * GET /api/checkout/options — courier list + free shipping threshold.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'couriers' => self::couriers(),
                'shipping_min_free' => (float) Setting::get('shipping_min_free', 150000),
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
            'courier' => 'required|string',
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

        // Validate courier.
        $courier = collect(self::couriers())->firstWhere('code', $data['courier']);
        if (! $courier) {
            throw ValidationException::withMessages(['courier' => 'Kurir tidak valid']);
        }

        // Referrer diambil dari profil user (ditetapkan saat register, permanen).
        $resellerId = $user->referrer_id ?: null;

        $order = DB::transaction(function () use ($data, $user, $shippingName, $shippingPhone, $shippingAddress, $courier, $resellerId, $tierService) {
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

            // Shipping cost — gratis jika subtotal setelah diskon lewat threshold.
            $shippingMinFree = (float) Setting::get('shipping_min_free', 150000);
            $shippingCost = $subtotal >= $shippingMinFree ? 0 : (float) $courier['cost'];
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
                'shipping_courier' => "{$courier['name']} {$courier['service']}",
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
