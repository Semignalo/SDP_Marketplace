<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\WithdrawalStatusUpdated;
use App\Models\CommissionWithdrawal;
use App\Models\ResellerCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class WithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|in:pending,approved,rejected',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = CommissionWithdrawal::with('user:id,name,email,reseller_code')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $items = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => $items->map(fn ($w) => $this->shape($w)),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ],
            'summary' => [
                'pending'  => (int) CommissionWithdrawal::where('status', 'pending')->count(),
                'approved' => (float) CommissionWithdrawal::where('status', 'approved')->sum('amount'),
            ],
        ]);
    }

    public function updateStatus(Request $request, CommissionWithdrawal $withdrawal): JsonResponse
    {
        $data = $request->validate([
            'status'      => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        DB::transaction(function () use ($withdrawal, $data) {
            $withdrawal->update([
                'status'       => $data['status'],
                'admin_notes'  => $data['admin_notes'] ?? null,
                'processed_at' => now(),
            ]);

            // Saat approved: kurangi saldo komisi earned milik reseller sebesar amount withdrawal.
            // Ambil komisi earned dengan lock agar tidak ada race condition.
            if ($data['status'] === 'approved') {
                $remaining = (float) $withdrawal->amount;

                $commissions = ResellerCommission::where('reseller_id', $withdrawal->user_id)
                    ->where('status', 'earned')
                    ->orderBy('created_at')
                    ->lockForUpdate()
                    ->get();

                foreach ($commissions as $commission) {
                    if ($remaining <= 0) break;
                    $commission->update(['status' => 'paid', 'paid_at' => now()]);
                    $remaining -= (float) $commission->amount;
                }

                // Jika saldo earned ternyata kurang (edge case: race condition terlambat terdeteksi), tolak.
                if ($remaining > 0.01) {
                    throw new \RuntimeException('Earned commission balance is not enough for this withdrawal.');
                }
            }
        });

        $withdrawal = $withdrawal->fresh('user');
        $this->sendWithdrawalStatusEmail($withdrawal);

        return response()->json(['message' => 'Withdrawal status updated.', 'data' => $this->shape($withdrawal)]);
    }

    /**
     * Best-effort: kirim email pemberitahuan status penarikan ke reseller.
     */
    private function sendWithdrawalStatusEmail(CommissionWithdrawal $withdrawal): void
    {
        try {
            if ($withdrawal->user?->email) {
                Mail::to($withdrawal->user->email)->send(new WithdrawalStatusUpdated($withdrawal));
            }
        } catch (Throwable $e) {
            Log::warning('Withdrawal status email failed', [
                'withdrawal' => $withdrawal->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function shape(CommissionWithdrawal $w): array
    {
        return [
            'id'                  => $w->id,
            'amount'              => $w->amount,
            'bank_name'           => $w->bank_name,
            'bank_account_number' => $w->bank_account_number,
            'bank_account_name'   => $w->bank_account_name,
            'notes'               => $w->notes,
            'status'              => $w->status,
            'admin_notes'         => $w->admin_notes,
            'processed_at'        => $w->processed_at?->toIso8601String(),
            'created_at'          => $w->created_at?->toIso8601String(),
            'user'                => $w->user ? [
                'id'            => $w->user->id,
                'name'          => $w->user->name,
                'email'         => $w->user->email,
                'reseller_code' => $w->user->reseller_code,
            ] : null,
        ];
    }
}
