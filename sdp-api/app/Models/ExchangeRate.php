<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'currency_code',
        'rate_to_idr',
        'source',
        'fetched_at',
    ];

    protected $casts = [
        'rate_to_idr' => 'decimal:6',
        'fetched_at' => 'datetime',
    ];
}
