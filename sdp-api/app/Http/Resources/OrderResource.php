<?php

namespace App\Http\Resources;

use App\Support\CourierTracking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'guest_email' => $this->guest_email,
            'referral_code' => $this->referral_code,
            'subtotal' => (float) $this->subtotal,
            'shipping_cost' => (float) $this->shipping_cost,
            'tier_discount' => (float) ($this->tier_discount ?? 0),
            'tier_name' => $this->tier_name,
            'total' => (float) $this->total,
            'shipping_name' => $this->shipping_name,
            'shipping_address' => $this->shipping_address,
            'shipping_phone' => $this->shipping_phone,
            'shipping_courier' => $this->shipping_courier,
            'tracking_number' => $this->tracking_number,
            'tracking_url' => CourierTracking::url($this->shipping_courier),
            'payment_proof' => $this->payment_proof,
            'payment_verified_at' => $this->payment_verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
        ];
    }
}
