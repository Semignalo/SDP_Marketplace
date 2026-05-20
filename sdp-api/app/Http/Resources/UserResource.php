<?php

namespace App\Http\Resources;

use App\Services\TierService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tierService = app(TierService::class);
        $spending = $tierService->userSpending($this->resource);
        $tier = $tierService->userTier($this->resource);
        $next = $tierService->nextTier($this->resource);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'address' => $this->address,
            'reseller_code' => $this->reseller_code,
            'vendor_id' => $this->vendor_id,
            'vendor' => $this->whenLoaded('vendor', fn () => [
                'id' => $this->vendor->id,
                'name' => $this->vendor->name,
                'slug' => $this->vendor->slug,
            ]),
            'total_spending' => $spending,
            'tier' => $tier,
            'next_tier' => $next,
            'all_tiers' => array_reverse($tierService->tiers()),
        ];
    }
}
