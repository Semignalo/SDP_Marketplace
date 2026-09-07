<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\RegionalStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductRegionalStockController extends Controller
{
    public function __construct(private RegionalStockService $service)
    {
    }

    public function index(Product $product): JsonResponse
    {
        return response()->json(['data' => $this->service->overview($product)]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate(RegionalStockService::rules());

        $this->service->sync($product, $data['stocks'], $request->user());

        ActivityLogger::log(
            'product',
            "Alokasi stok regional produk {$product->name} diperbarui oleh {$request->user()->name}",
            $request->user(),
            $product,
        );

        return response()->json([
            'data' => $this->service->overview($product->fresh()),
            'message' => 'Regional stock updated',
        ]);
    }
}
