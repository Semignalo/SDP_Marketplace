<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentConfirmation;
use App\Models\Order;
use App\Models\ResellerCommission;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

    public function confirmPayment(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status !== 'pending_payment') {
            return response()->json(['message' => 'Pesanan tidak menunggu pembayaran'], 422);
        }

        $order->update([
            'status' => 'processing',
            'payment_verified_at' => now(),
        ]);

        return response()->json(['message' => 'Pembayaran dikonfirmasi', 'data' => ['status' => 'processing']]);
    }

    public function checkStatus(Request $request, string $orderNumber, MidtransService $midtrans): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status !== 'pending_payment') {
            return response()->json(['data' => ['status' => $order->status]]);
        }

        try {
            $result = $midtrans->checkTransactionStatus($orderNumber);
        } catch (Throwable $e) {
            // Transaksi belum ada di Midtrans (belum pernah bayar)
            return response()->json(['data' => ['status' => $order->status]]);
        }

        $next = $result['next_status'];
        if ($next) {
            DB::transaction(function () use ($order, $next, $result) {
                $payload = ['status' => $next];
                if ($next === 'processing') {
                    $payload['payment_verified_at'] = now();
                    $payload['payment_transaction_id'] = $result['transaction_id'] ?? null;
                    $payload['payment_type'] = $result['payment_type'] ?? null;
                    $payload['payment_channel'] = $result['payment_channel'] ?? null;
                    $payload['payment_gross_amount'] = $result['gross_amount'] ?? null;
                }
                $order->update($payload);

                $commission = ResellerCommission::where('order_id', $order->id)->first();
                if ($commission && $next === 'cancelled' && in_array($commission->status, ['pending', 'earned'])) {
                    $commission->update(['status' => 'cancelled']);
                }
            });

            // Kirim email konfirmasi pembayaran setelah status berubah ke processing
            if ($next === 'processing') {
                $this->sendPaymentConfirmationEmail($order->fresh());
            }
        }

        return response()->json(['data' => ['status' => $order->fresh()->status]]);
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

        $wasAlreadyProcessing = $order->status !== 'pending_payment';

        DB::transaction(function () use ($order, $next, $result) {
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
                $payload['payment_transaction_id'] = $result['transaction_id'] ?? null;
                $payload['payment_type'] = $result['payment_type'] ?? null;
                $payload['payment_channel'] = $result['payment_channel'] ?? null;
                $payload['payment_gross_amount'] = $result['gross_amount'] ?? null;
            }
            $order->update($payload);

            // Sync commission status
            $commission = ResellerCommission::where('order_id', $order->id)->first();
            if ($commission) {
                if ($next === 'cancelled' && in_array($commission->status, ['pending', 'earned'])) {
                    $commission->update(['status' => 'cancelled']);
                }
            }
        });

        // Kirim email konfirmasi pembayaran — hanya kalau status baru berubah ke processing
        if ($next === 'processing' && ! $wasAlreadyProcessing) {
            $this->sendPaymentConfirmationEmail($order->fresh());
        }

        Log::info('Midtrans webhook processed', ['order' => $order->order_number, 'next' => $next]);

        return response()->json(['message' => 'OK', 'order_status' => $order->fresh()->status]);
    }

    /**
     * Kirim email PaymentConfirmation ke guest atau user yang login.
     * Best-effort: error di-log tapi tidak throw.
     */
    private function sendPaymentConfirmationEmail(Order $order): void
    {
        try {
            // Guest order — kirim ke guest_email
            if (! $order->user_id && $order->guest_email) {
                Mail::to($order->guest_email)->send(new PaymentConfirmation($order));
                Log::info('Payment confirmation email sent to guest', [
                    'order' => $order->order_number,
                    'email' => $order->guest_email,
                ]);
                return;
            }

            // Logged-in user — kirim ke email akun
            if ($order->user_id) {
                $order->loadMissing('user');
                if ($order->user?->email) {
                    Mail::to($order->user->email)->send(new PaymentConfirmation($order));
                    Log::info('Payment confirmation email sent to user', [
                        'order' => $order->order_number,
                        'email' => $order->user->email,
                    ]);
                }
            }
        } catch (Throwable $e) {
            Log::warning('Payment confirmation email failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
