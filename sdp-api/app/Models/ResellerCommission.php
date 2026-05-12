<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResellerCommission extends Model
{
    protected $fillable = [
        'reseller_id', 'order_id', 'customer_id',
        'order_total', 'rate', 'amount', 'status', 'paid_at',
    ];

    public function reseller()
    {
        return $this->belongsTo(User::class, 'reseller_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
