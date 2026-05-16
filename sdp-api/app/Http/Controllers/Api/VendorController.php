<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;

class VendorController extends Controller
{
    public function index()
    {
        $vendors = Vendor::query()
            ->where('status', 'active')
            ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('name')
            ->get();

        return VendorResource::collection($vendors);
    }

    public function show(string $slug)
    {
        $vendor = Vendor::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
            ->firstOrFail();

        $products = $vendor->products()
            ->active()
            ->with(['vendor', 'category', 'images'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => new VendorResource($vendor),
            'products' => ProductResource::collection($products)->response()->getData(),
        ]);
    }
}
