<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'role' => 'nullable|in:customer,vendor_admin,admin',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = User::query()
            ->with('vendor:id,name,slug')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        $users = $query->paginate($request->input('per_page', 20))->withQueryString();

        return response()->json([
            'data' => collect($users->items())->map(fn ($u) => $this->shape($u)),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'role' => 'sometimes|in:customer,vendor_admin,admin',
            'vendor_id' => 'nullable|integer|exists:vendors,id',
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:6',
        ]);

        // Cek vendor_admin harus punya vendor_id
        if (($data['role'] ?? $user->role) === 'vendor_admin' && empty($data['vendor_id'] ?? $user->vendor_id)) {
            return response()->json(['message' => 'Vendor wajib dipilih untuk role vendor_admin', 'errors' => ['vendor_id' => ['Wajib pilih vendor']]], 422);
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        $user->load('vendor:id,name,slug');

        return response()->json(['message' => 'User diperbarui', 'data' => $this->shape($user)]);
    }

    public function network(User $user): JsonResponse
    {
        $referrals = User::where('referrer_id', $user->id)
            ->withCount('orders')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'orders_count' => $u->orders_count,
                'joined_at'    => $u->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'user' => $this->shape($user),
            'data' => $referrals,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak bisa hapus akun sendiri'], 422);
        }
        $user->delete();
        return response()->json(['message' => 'User dihapus']);
    }

    private function shape(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'phone' => $u->phone,
            'reseller_code' => $u->reseller_code,
            'vendor_id' => $u->vendor_id,
            'vendor' => $u->vendor ? ['id' => $u->vendor->id, 'name' => $u->vendor->name, 'slug' => $u->vendor->slug] : null,
            'created_at' => $u->created_at?->toIso8601String(),
        ];
    }

}
