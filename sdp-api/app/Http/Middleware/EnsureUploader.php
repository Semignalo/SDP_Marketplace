<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUploader
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            in_array($request->user()?->role, ['admin', 'vendor_admin']),
            403,
            'Upload hanya untuk admin dan vendor'
        );
        return $next($request);
    }
}
