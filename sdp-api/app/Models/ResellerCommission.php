<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResellerCommission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reseller_id',
        'order_id',
        'customer_id',
        'guest_name',
        'guest_email',
        'order_total',
        'rate',
        'amount',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'order_total' => 'decimal:2',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reseller_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
