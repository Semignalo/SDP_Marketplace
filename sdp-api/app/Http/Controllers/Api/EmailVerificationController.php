<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5174'), '/');
        $user = User::find($id);

        if (!$user || !hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return redirect($frontend . '/email-verified?status=invalid');
        }

        if (!$request->hasValidSignature()) {
            return redirect($frontend . '/email-verified?status=expired');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($frontend . '/email-verified?status=already');
        }

        $user->markEmailAsVerified();

        return redirect($frontend . '/email-verified?status=success');
    }

    public function resend(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email sudah diverifikasi.'], 422);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email verifikasi telah dikirim ulang.']);
    }
}
