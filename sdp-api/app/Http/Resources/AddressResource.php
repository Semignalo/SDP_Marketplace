<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'city_id' => $this->city_id,
            'province' => $this->province,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'is_default' => $this->is_default,
        ];
    }
}
