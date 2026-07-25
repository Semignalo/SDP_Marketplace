<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Auth token statis untuk endpoint asisten personal (OpenClaw).
 * Sengaja bukan Sanctum: dipanggil oleh agent lokal, bukan sesi browser.
 *
 * Fail-closed — kalau ASSISTANT_API_TOKEN belum diset, semua request ditolak.
 * Jangan pernah dibalik jadi "kalau kosong berarti bebas".
 */
class EnsureAssistantToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.assistant.token');

        abort_if($expected === '', 503, 'Assistant API belum dikonfigurasi');

        $given = (string) ($request->bearerToken() ?? '');

        // hash_equals: perbandingan waktu-tetap, biar token gak bisa ditebak
        // bertahap lewat selisih waktu respons.
        abort_unless($given !== '' && hash_equals($expected, $given), 401, 'Token tidak valid');

        return $next($request);
    }
}
