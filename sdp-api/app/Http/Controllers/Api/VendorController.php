<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRegion;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    use ResolvesRegion;

    public function index()
    {
        $vendors = Vendor::query()
            ->where('status', 'active')
            ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('name')
            ->get();

        return VendorResource::collection($vendors);
    }

    public function show(string $slug, Request $request)
    {
        $country = $this->attachRegionContext($request);

        $vendor = Vendor::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
            ->firstOrFail();

        $products = $vendor->products()
            ->active()
            ->with([
                'vendor',
                'category',
                'images',
                'regionalPrices' => fn ($q) => $q->where('country_code', $country),
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => new VendorResource($vendor),
            'products' => ProductResource::collection($products)->response()->getData(),
        ]);
    }
}
