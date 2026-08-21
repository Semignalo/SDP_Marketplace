<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ExchangeRateService;
use App\Services\GeoLocationService;
use App\Support\Regions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Konteks lokalisasi storefront: negara pengunjung + kurs + daftar region yang didukung.
 *
 * Sengaja satu endpoint (bukan /geo dan /exchange-rates terpisah) karena frontend
 * selalu butuh ketiganya barengan saat boot — satu request, bukan tiga.
 */
class StorefrontController extends Controller
{
    public function __construct(
        private GeoLocationService $geo,
        private ExchangeRateService $rates,
    ) {
    }

    public function region(Request $request)
    {
        $detected = $this->geo->resolve($request->ip());
        $rates = $this->rates->rates();

        $regions = collect(config('regions.countries', []))
            ->map(fn ($region, $code) => [
                'country_code' => $code,
                'country_name' => $region['name'],
                'currency' => $region['currency'],
                'locale' => $region['locale'],
                // Kurs null = belum pernah berhasil ditarik; frontend jatuh balik ke IDR.
                'rate_to_idr' => $rates[$region['currency']] ?? null,
            ])
            ->values();

        return response()->json([
            'data' => [
                'detected' => $detected,
                'regions' => $regions,
                'rates' => $rates,
                'base_currency' => config('regions.base_currency', 'IDR'),
            ],
        ]);
    }

    /**
     * POST /api/storefront/reprice — harga keranjang untuk satu negara tujuan kirim.
     *
     * Keranjang menyimpan harga saat produk dimasukkan, sementara yang ditagih adalah
     * harga negara tujuan (lihat CheckoutController::store). Tanpa endpoint ini, customer
     * yang browsing sebagai negara A tapi kirim ke negara B baru tahu harganya berubah
     * setelah order jadi.
     *
     * Sengaja memakai Regions::codeFromName() + effectivePriceIdr() yang sama persis
     * dengan checkout, supaya angka yang ditampilkan tidak bisa melenceng dari yang ditagih.
     */
    public function reprice(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Nama negara seperti yang dipakai form checkout ("Australia"), bukan kode.
            'country' => 'nullable|string|max:60',
            'items' => 'required|array|min:1|max:99',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
        ]);

        $country = Regions::codeFromName($data['country'] ?? null);

        $products = Product::whereIn('id', collect($data['items'])->pluck('product_id'))
            ->with(['regionalPrices' => fn ($q) => $q->where('country_code', $country)])
            ->get()
            ->keyBy('id');

        $subtotal = 0;
        $lines = [];

        foreach ($data['items'] as $line) {
            $product = $products->get($line['product_id']);
            if (! $product) {
                continue;
            }

            $price = $product->effectivePriceIdr($country);
            $subtotal += $price * $line['quantity'];

            $lines[] = [
                'product_id' => $product->id,
                'price' => $price,
                'base_price' => (float) $product->price,
                'regional_price_applied' => $price !== (float) $product->price,
            ];
        }

        return response()->json([
            'data' => [
                'country_code' => $country,
                'lines' => $lines,
                'subtotal' => $subtotal,
            ],
        ]);
    }
}
