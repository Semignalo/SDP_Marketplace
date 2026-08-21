<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\RegionalPriceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductRegionalPriceController extends Controller
{
    public function __construct(private RegionalPriceService $service)
    {
    }

    public function index(Product $product): JsonResponse
    {
        return response()->json(['data' => $this->service->overview($product)]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate(RegionalPriceService::rules());

        $this->service->sync($product, $data['prices'], $request->user());

        ActivityLogger::log(
            'product',
            "Harga regional produk {$product->name} diperbarui oleh {$request->user()->name}",
            $request->user(),
            $product,
        );

        return response()->json([
            'data' => $this->service->overview($product->fresh()),
            'message' => 'Regional prices updated',
        ]);
    }
}
