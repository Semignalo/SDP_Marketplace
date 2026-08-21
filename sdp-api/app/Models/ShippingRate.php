<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'country',
        'country_code',
        'zone',
        'weight_kg',
        'length_cm',
        'width_cm',
        'height_cm',
        'service',
        'term',
        'base_rate',
        'fsc_percent',
        'esc_amount',
        'add_fee_custom',
        'ogb_fee',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:2',
        'length_cm' => 'decimal:1',
        'width_cm' => 'decimal:1',
        'height_cm' => 'decimal:1',
        'fsc_percent' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function getFscAmountAttribute(): int
    {
        return (int) round($this->base_rate * $this->fsc_percent / 100);
    }

    public function getFinalPriceAttribute(): int
    {
        return $this->base_rate + $this->fsc_amount + $this->esc_amount + $this->add_fee_custom + $this->ogb_fee;
    }
}
