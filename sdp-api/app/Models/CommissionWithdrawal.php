<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommissionWithdrawal extends Model
{
    protected $fillable = [
        'user_id', 'amount', 'bank_name', 'bank_account_number',
        'bank_account_name', 'notes', 'status', 'admin_notes', 'processed_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
