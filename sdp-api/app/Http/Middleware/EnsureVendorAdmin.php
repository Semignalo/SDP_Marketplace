<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVendorAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'vendor_admin' && $user->vendor_id, 403, 'Hanya untuk akun vendor');

        return $next($request);
    }
}
