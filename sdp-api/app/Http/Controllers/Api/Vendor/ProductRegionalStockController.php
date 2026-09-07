<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\RegionalStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Vendor boleh atur alokasi stok regional produknya sendiri tanpa approval admin
 * (model vendor di SDP invite-only, jadi sudah dianggap tepercaya).
 */
class ProductRegionalStockController extends Controller
{
    public function __construct(private RegionalStockService $service)
    {
    }

    public function index(Request $request, Product $product): JsonResponse
    {
        $this->ensureOwned($request, $product);

        return response()->json(['data' => $this->service->overview($product)]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->ensureOwned($request, $product);

        $data = $request->validate(RegionalStockService::rules());

        $this->service->sync($product, $data['stocks'], $request->user());

        ActivityLogger::log(
            'product',
            "Alokasi stok regional produk {$product->name} diperbarui oleh vendor {$request->user()->name}",
            $request->user(),
            $product,
        );

        return response()->json([
            'data' => $this->service->overview($product->fresh()),
            'message' => 'Regional stock updated',
        ]);
    }

    private function ensureOwned(Request $request, Product $product): void
    {
        abort_unless($product->vendor_id === $request->user()->vendor_id, 403);
    }
}
