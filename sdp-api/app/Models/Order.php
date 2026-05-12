<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'reseller_id', 'order_number', 'status',
        'subtotal', 'shipping_cost', 'total',
        'shipping_name', 'shipping_address', 'shipping_phone',
        'shipping_courier', 'tracking_number',
        'payment_proof', 'payment_verified_at', 'admin_notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reseller()
    {
        return $this->belongsTo(User::class, 'reseller_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function commission()
    {
        return $this->hasOne(ResellerCommission::class);
    }
}
