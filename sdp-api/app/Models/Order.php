<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'guest_email',
        'guest_token',
        'reseller_id',
        'referral_code',
        'order_number',
        'status',
        'subtotal',
        'shipping_cost',
        'tier_discount',
        'tier_name',
        'total',
        'shipping_name',
        'shipping_address',
        'shipping_country',
        'shipping_phone',
        'shipping_courier',
        'tracking_number',
        'payment_proof',
        'payment_verified_at',
        'payment_transaction_id',
        'payment_type',
        'payment_channel',
        'payment_gross_amount',
        'admin_notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'tier_discount' => 'decimal:2',
        'total' => 'decimal:2',
        'payment_gross_amount' => 'decimal:2',
        'payment_verified_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reseller_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function commission(): HasOne
    {
        return $this->hasOne(ResellerCommission::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
