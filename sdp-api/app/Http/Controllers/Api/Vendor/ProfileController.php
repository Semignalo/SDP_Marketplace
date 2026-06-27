<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $vendor = Vendor::findOrFail($request->user()->vendor_id);

        return response()->json([
            'data' => [
                'id' => $vendor->id,
                'name' => $vendor->name,
                'slug' => $vendor->slug,
                'logo' => $vendor->logo,
                'description' => $vendor->description,
                'email' => $vendor->email,
                'phone' => $vendor->phone,
                'commission_rate' => (float) $vendor->commission_rate,
                'status' => $vendor->status,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'logo' => 'nullable|url|max:500',
            'description' => 'nullable|string|max:2000',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:30',
        ]);

        $vendor = Vendor::findOrFail($request->user()->vendor_id);
        $vendor->update($data);

        return response()->json(['message' => 'Vendor profile updated', 'data' => $vendor->only(['id', 'name', 'slug', 'logo', 'description', 'email', 'phone'])]);
    }
}
