<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Dipanggil oleh frontend via AJAX (bukan navigasi langsung dari link email) —
     * lihat App\Notifications\VerifyEmail. Mengembalikan JSON status, bukan redirect,
     * supaya browser tidak pernah lompat antar-domain saat user klik link verifikasi.
     */
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::find($id);

        if (!$user || !hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['status' => 'invalid']);
        }

        if (!$request->hasValidSignature()) {
            return response()->json(['status' => 'expired']);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['status' => 'already']);
        }

        $user->markEmailAsVerified();

        return response()->json(['status' => 'success']);
    }

    public function resend(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.'], 422);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email resent.']);
    }
}
