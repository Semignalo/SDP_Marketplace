<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $referrerId = null;
        if (!empty($data['ref_code'])) {
            $referrer = User::where('reseller_code', $data['ref_code'])->first();
            $referrerId = $referrer?->id;
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => 'customer',
            'referrer_id' => $referrerId,
            'reseller_code' => $this->uniqueReferralCode(),
        ]);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Account created. Check your email to verify it.',
            'email' => $user->email,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (!$user->hasVerifiedEmail() && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Email not verified yet. Check your inbox.',
                'email' => $user->email,
                'unverified' => true,
            ], 403);
        }

        $token = $user->createToken('sdp-web')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load('vendor')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('vendor')),
        ]);
    }

    private function uniqueReferralCode(): string
    {
        $prefix = 'STA' . now()->format('y');
        do {
            $code = $prefix . strtoupper(Str::random(6));
        } while (User::where('reseller_code', $code)->exists());
        return $code;
    }
}
