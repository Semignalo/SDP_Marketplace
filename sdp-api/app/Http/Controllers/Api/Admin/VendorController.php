<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VendorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive,suspended',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Vendor::query()
            ->withCount(['products', 'users'])
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $vendors = $query->paginate($request->input('per_page', 20))->withQueryString();

        return response()->json([
            'data' => collect($vendors->items())->map(fn ($v) => $this->shape($v)),
            'meta' => [
                'current_page' => $vendors->currentPage(),
                'last_page' => $vendors->lastPage(),
                'per_page' => $vendors->perPage(),
                'total' => $vendors->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'slug' => 'nullable|string|max:140|unique:vendors,slug',
            'logo' => 'nullable|url|max:500',
            'description' => 'nullable|string|max:2000',
            'email' => 'required|email|max:120|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'required|in:active,inactive,suspended',
            'admin_password' => 'required|string|min:6',
        ]);

        $vendor = DB::transaction(function () use ($data, $request) {
            $vendor = Vendor::create([
                'name' => $data['name'],
                'slug' => $data['slug'] ?: $this->uniqueSlug($data['name']),
                'logo' => $data['logo'] ?? null,
                'description' => $data['description'] ?? null,
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'commission_rate' => $data['commission_rate'] ?? 0,
                'status' => $data['status'],
                'invited_by' => $request->user()->id,
            ]);

            User::create([
                'name' => $data['name'] . ' Owner',
                'email' => $data['email'],
                'password' => Hash::make($data['admin_password']),
                'role' => 'vendor_admin',
                'vendor_id' => $vendor->id,
                'phone' => $data['phone'] ?? null,
            ]);

            return $vendor->loadCount(['products', 'users']);
        });

        return response()->json(['message' => 'Vendor and admin account created', 'data' => $this->shape($vendor)], 201);
    }

    public function update(Request $request, Vendor $vendor): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'slug' => 'sometimes|string|max:140|unique:vendors,slug,' . $vendor->id,
            'logo' => 'nullable|url|max:500',
            'description' => 'nullable|string|max:2000',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:30',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        $vendor->update($data);
        $vendor->loadCount(['products', 'users']);

        return response()->json(['message' => 'Vendor updated', 'data' => $this->shape($vendor)]);
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        $vendor->delete();
        return response()->json(['message' => 'Vendor deleted']);
    }

    private function shape(Vendor $v): array
    {
        return [
            'id' => $v->id,
            'name' => $v->name,
            'slug' => $v->slug,
            'logo' => $v->logo,
            'description' => $v->description,
            'email' => $v->email,
            'phone' => $v->phone,
            'commission_rate' => (float) $v->commission_rate,
            'status' => $v->status,
            'products_count' => $v->products_count ?? 0,
            'users_count' => $v->users_count ?? 0,
            'created_at' => $v->created_at?->toIso8601String(),
        ];
    }

    private function uniqueSlug(string $source): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $n = 1;
        while (Vendor::where('slug', $slug)->exists()) {
            $slug = $base . '-' . (++$n);
        }
        return $slug;
    }
}
