<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->orderBy('id')->get();
        return AddressResource::collection($addresses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {
            if (!empty($data['is_default']) || $user->addresses()->count() === 0) {
                $user->addresses()->update(['is_default' => false]);
                $data['is_default'] = true;
            }

            $address = $user->addresses()->create($data);
            return response()->json(['data' => new AddressResource($address)], 201);
        });
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        $this->authorizeUser($request, $address);

        $data = $this->validated($request);

        return DB::transaction(function () use ($data, $address, $request) {
            if (!empty($data['is_default'])) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($data);
            return response()->json(['data' => new AddressResource($address)]);
        });
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorizeUser($request, $address);
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = $request->user()->addresses()->orderBy('id')->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Alamat dihapus.']);
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'label' => 'nullable|string|max:32',
            'recipient_name' => 'required|string|max:120',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:255',
            'city_id' => 'nullable|integer',
            'country' => 'nullable|string|max:60',
            'postal_code' => 'nullable|string|max:10',
            'is_default' => 'nullable|boolean',
        ]);
    }

    protected function authorizeUser(Request $request, Address $address): void
    {
        abort_if($address->user_id !== $request->user()->id, 403);
    }
}
