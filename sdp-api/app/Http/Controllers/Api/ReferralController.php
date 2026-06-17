<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    /**
     * GET /api/referral/validate?code=XXXX — cek validitas kode referral (public).
     * Dipakai checkout (guest/manual) untuk auto-fill & validasi.
     */
    public function validateCode(Request $request): JsonResponse
    {
        $code = strtoupper(trim((string) $request->query('code', '')));

        if ($code === '') {
            return response()->json([
                'data' => ['valid' => false, 'message' => 'Kode referral kosong'],
            ]);
        }

        $referrer = User::where('reseller_code', $code)->first();

        if (! $referrer) {
            return response()->json([
                'data' => ['valid' => false, 'message' => 'Kode referral tidak ditemukan'],
            ]);
        }

        return response()->json([
            'data' => [
                'valid'         => true,
                'code'          => $code,
                'referrer_name' => $referrer->name,
            ],
        ]);
    }
}
