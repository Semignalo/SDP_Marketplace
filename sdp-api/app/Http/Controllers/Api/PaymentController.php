<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ResellerCommission;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    public function snapToken(Request $request, string $orderNumber, MidtransService $midtrans): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status !== 'pending_payment') {
            return response()->json(['message' => 'Pesanan tidak menunggu pembayaran'], 422);
        }

        if (! $midtrans->isConfigured()) {
            return response()->json([
                'message' => 'Midtrans belum dikonfigurasi. Hubungi admin untuk setup payment gateway.',
                'configured' => false,
            ], 503);
        }

        try {
            $token = $midtrans->getSnapToken($order);
            return response()->json([
                'data' => [
                    'token' => $token,
                    'client_key' => config('midtrans.client_key'),
                    'is_production' => (bool) config('midtrans.is_production'),
                ],
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        } catch (Throwable $e) {
            Log::error('Midtrans snap token failed', ['order' => $orderNumber, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal generate token pembayaran: ' . $e->getMessage()], 500);
        }
    }

    public function notification(MidtransService $midtrans): JsonResponse
    {
        try {
            $result = $midtrans->resolveNotification();
        } catch (Throwable $e) {
            Log::warning('Midtrans webhook invalid', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid signature or payload'], 400);
        }

        $order = Order::where('order_number', $result['order_number'])->first();
        if (! $order) {
            Log::warning('Midtrans webhook: order not found', ['order' => $result['order_number']]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        $next = $result['next_status'];
        if (! $next) {
            // pending/challenge — biarkan status tetap pending_payment
            return response()->json(['message' => 'OK', 'order_status' => $order->status]);
        }

        DB::transaction(function () use ($order, $next) {
            // Idempotent: skip kalau status sudah lebih maju dari pending_payment
            if ($next === 'processing' && $order->status !== 'pending_payment') {
                return;
            }
            if ($next === 'cancelled' && in_array($order->status, ['completed', 'shipped'])) {
                return;
            }

            $payload = ['status' => $next];
            if ($next === 'processing') {
                $payload['payment_verified_at'] = now();
            }
            $order->update($payload);

            // Sync commission status
            $commission = ResellerCommission::where('order_id', $order->id)->first();
            if ($commission) {
                if ($next === 'cancelled' && in_array($commission->status, ['pending', 'earned'])) {
                    $commission->update(['status' => 'cancelled']);
                }
                // Commission status stays "pending" until order is fully "completed"
            }
        });

        Log::info('Midtrans webhook processed', ['order' => $order->order_number, 'next' => $next]);

        return response()->json(['message' => 'OK', 'order_status' => $order->fresh()->status]);
    }
}
