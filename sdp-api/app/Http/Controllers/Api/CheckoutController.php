<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Mail\OrderConfirmation;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductRegionalStock;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\InternationalShippingService;
use App\Services\ShippingZoneService;
use App\Services\TierService;
use App\Support\Regions;
use App\Support\WorldCountries;
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
        $guestTier = $tierService->tierByLevel(3);

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
    public function shippingRates(Request $request, ShippingZoneService $zoneService, InternationalShippingService $intlShippingService): JsonResponse
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

        $isInternational = strcasecmp(trim($address->country ?: 'Indonesia'), 'Indonesia') !== 0;
        $quote = $isInternational
            ? $intlShippingService->quote($address->country, $totalWeight)
            : $zoneService->quote($address->province, $totalWeight);

        return response()->json([
            'data' => [
                'cost'              => $quote['cost'],
                'requires_manual'   => $quote['requires_manual'],
                'zone_label'        => $quote['label'],
                // Subsidi free-shipping cuma berlaku domestik — internasional selalu 0/0
                // biar frontend tidak salah kira ada subsidi yang ikut mengurangi ongkir.
                'free_shipping_min' => $isInternational ? 0 : (float) Setting::get('shipping_min_free', 150000),
                'free_shipping_max' => $isInternational ? 0 : (float) Setting::get('shipping_max_free', 20000),
                'total_weight'      => $totalWeight,
            ],
        ]);
    }

    /**
     * POST /api/orders — create order from cart.
     */
    public function store(Request $request, TierService $tierService, ShippingZoneService $zoneService, InternationalShippingService $intlShippingService): JsonResponse
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

        $order = DB::transaction(function () use ($data, $user, $shippingName, $shippingPhone, $shippingAddress, $shippingCountry, $shippingProvince, $isInternational, $resellerId, $tierService, $zoneService, $intlShippingService) {
            /*
             * Harga regional ditentukan oleh negara TUJUAN KIRIM, bukan region switcher
             * di browser — nilai dari client tidak pernah dipercaya untuk menentukan harga.
             */
            $priceCountry = Regions::codeFromName($shippingCountry);

            /*
             * Regional stock ditentukan oleh negara TUJUAN KIRIM juga (bukan region
             * switcher) — konsisten dengan trust model harga: mencegah orang browsing
             * sebagai negara "kaya stok" lalu checkout ke negara lain buat akalin alokasi.
             * Scope-nya beda dari $priceCountry: WorldCountries kenal ~200 negara,
             * Regions cuma 4 pricing_countries.
             */
            $stockCountry = WorldCountries::codeFromName($shippingCountry);

            // Lock & verify products. Urutan lock SELALU products dulu baru
            // product_regional_stocks di semua tempat yang menyentuh keduanya — hindari deadlock.
            $productIds = collect($data['items'])->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)
                ->with(['regionalPrices' => fn ($q) => $q->where('country_code', $priceCountry)])
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $regionalStocks = $stockCountry
                ? ProductRegionalStock::whereIn('product_id', $productIds)
                    ->where('country_code', $stockCountry)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('product_id')
                : collect();

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

                /** @var ProductRegionalStock|null $regionalStock */
                $regionalStock = $regionalStocks->get($product->id);

                if ($regionalStock !== null) {
                    // Negara ini punya alokasi khusus — itu yang berlaku, independen dari stock global.
                    if ($regionalStock->remaining_qty < $line['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => $regionalStock->remaining_qty > 0
                                ? "Only {$regionalStock->remaining_qty} left in stock for {$product->name} in your delivery country"
                                : "{$product->name} is not available for delivery to your country",
                        ]);
                    }
                } elseif ($product->stock < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Only {$product->stock} left in stock for {$product->name}",
                    ]);
                }

                $unitPrice = $product->effectivePriceIdr($priceCountry);
                $lineSubtotal = $unitPrice * $line['quantity'];
                $subtotalBeforeDiscount += $lineSubtotal;
                $totalWeight += ($product->weight_gram ?? 300) * $line['quantity'];

                $orderItemsData[] = [
                    'product' => $product,
                    'regional_stock' => $regionalStock,
                    'price' => $unitPrice,
                    'quantity' => $line['quantity'],
                    'subtotal' => $lineSubtotal,
                ];
            }

            // Apply tier discount ke subtotal (sebelum shipping calc).
            // Order internasional tidak ikut sistem tiering.
            $tierResult = $isInternational
                ? ['subtotal_after' => $subtotalBeforeDiscount, 'discount' => 0.0, 'tier' => null]
                : $tierService->applyDiscount($subtotalBeforeDiscount, $user);
            $subtotal = $tierResult['subtotal_after'];
            $tierDiscount = $tierResult['discount'];
            $tierName = $tierResult['tier']['name'] ?? null;

            // Ongkir dihitung server-side, bukan input client. Domestik: zona provinsi
            // (flat rate). Internasional: cocokkan ke shipping_rates by nama negara —
            // kalau negaranya belum ada rate-nya, tetap jatuh ke manual seperti sebelumnya.
            $zoneQuote = $isInternational
                ? $intlShippingService->quote($shippingCountry, max(1, $totalWeight))
                : $zoneService->quote($shippingProvince, max(1, $totalWeight));
            $needsManualQuote = $zoneQuote['requires_manual'] ?? true;

            if ($needsManualQuote) {
                // Ongkir belum bisa dihitung otomatis (negara/zona belum ada rate-nya) —
                // order ditahan di awaiting_quote sampai admin input ongkir manual.
                $shippingCost = 0;
                $total = $subtotal;
            } elseif ($isInternational) {
                // Ongkir internasional flat, TIDAK ikut subsidi shipping_min_free/max —
                // itu promo khusus zona domestik.
                $shippingCost = (int) $zoneQuote['cost'];
                $total = $subtotal + $shippingCost;
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
                /*
                 * Ongkir internasional yang otomatis ketemu tetap dicatat "sudah di-quote"
                 * (walau bukan admin manual) — supaya order ini ikut kena 30 hari grace
                 * period auto-cancel yang sama (lihat CancelExpiredOrders), bukan
                 * nyangkut selamanya di pending_payment kalau tidak pernah dibayar.
                 */
                'quoted_at' => ($isInternational && ! $needsManualQuote) ? now() : null,
            ]);

            foreach ($orderItemsData as $line) {
                /** @var Product $product */
                $product = $line['product'];
                /** @var ProductRegionalStock|null $regionalStock */
                $regionalStock = $line['regional_stock'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_regional_stock_id' => $regionalStock?->id,
                    'vendor_id' => $product->vendor_id,
                    'product_name' => $product->name,
                    'price' => $line['price'],
                    'quantity' => $line['quantity'],
                    'subtotal' => $line['subtotal'],
                ]);

                if ($regionalStock) {
                    // products.stock SENGAJA tidak disentuh — dua pool independen.
                    $regionalStock->decrement('remaining_qty', $line['quantity']);
                } else {
                    $product->decrement('stock', $line['quantity']);
                }
            }

            // Reseller commission (status pending sampai order completed).
            if ($resellerId) {
                $rate = (float) Setting::get('reseller_commission_rate', 5);
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

        ActivityLogger::log(
            'checkout',
            "Order {$order->order_number} dibuat oleh {$user->name}, total Rp " . number_format($order->total, 0, ',', '.'),
            $user,
            $order,
            ['total' => $order->total, 'status' => $order->status]
        );

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
