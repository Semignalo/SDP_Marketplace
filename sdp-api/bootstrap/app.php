<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'vendor_admin' => \App\Http\Middleware\EnsureVendorAdmin::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'uploader' => \App\Http\Middleware\EnsureUploader::class,
            'assistant' => \App\Http\Middleware\EnsureAssistantToken::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Cuma order yang SUDAH di-quote ongkirnya yang bisa auto-cancel (30 hari sejak
        // quoted_at, lihat CancelExpiredOrders). Order domestik/belum di-quote tidak pernah disentuh.
        $schedule->command('orders:cancel-expired')->daily();
        $schedule->command('orders:complete-shipped')->daily();

        // Kurs cuma dipakai buat menampilkan harga (penagihan tetap IDR), jadi
        // 4 jam sekali sudah lebih dari cukup dan hemat kuota API gratisan.
        $schedule->command('rates:fetch')->everyFourHours();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
