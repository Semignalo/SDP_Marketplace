<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Throwable;

class ActivityLogger
{
    /**
     * Catat satu aksi user/admin ke activity_log. Dibungkus try/catch supaya kegagalan logging
     * TIDAK PERNAH menggagalkan transaksi bisnis utama (checkout, dll) — sama seperti pola
     * try/catch di sekitar Mail::send() pada CheckoutController.
     */
    public static function log(string $logName, string $description, ?User $causer = null, ?Model $subject = null, array $properties = []): void
    {
        try {
            $log = activity($logName)->causedBy($causer);
            if ($subject !== null) {
                $log->performedOn($subject);
            }
            $log
                ->withProperties(array_merge($properties, [
                    'ip_address' => request()?->ip(),
                    'causer_role' => $causer?->role ?? 'guest',
                ]))
                ->log($description);
        } catch (Throwable $e) {
            Log::warning('ActivityLogger gagal mencatat log', ['log_name' => $logName, 'error' => $e->getMessage()]);
        }
    }
}
