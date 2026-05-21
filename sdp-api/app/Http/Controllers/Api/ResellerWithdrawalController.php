<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionWithdrawal;
use App\Models\ResellerCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResellerWithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = CommissionWithdrawal::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'data' => $items->map(fn ($w) => $this->shape($w)),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount'              => 'required|numeric|min:10000',
            'bank_name'           => 'required|string|max:100',
            'bank_account_number' => 'required|string|max:50',
            'bank_account_name'   => 'required|string|max:100',
            'notes'               => 'nullable|string|max:500',
        ]);

        $userId = $request->user()->id;

        $withdrawal = DB::transaction(function () use ($data, $userId) {
            // Lock semua komisi earned milik user ini agar tidak bisa double-submit paralel
            $available = ResellerCommission::where('reseller_id', $userId)
                ->where('status', 'earned')
                ->lockForUpdate()
                ->sum('amount');

            if ($data['amount'] > $available) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => ["Saldo tersedia: Rp " . number_format($available, 0, ',', '.')],
                ]);
            }

            // Cek tidak ada withdrawal pending yang belum diproses
            $hasPending = CommissionWithdrawal::where('user_id', $userId)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->exists();

            if ($hasPending) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => ['Masih ada permintaan penarikan yang sedang diproses.'],
                ]);
            }

            return CommissionWithdrawal::create([
                'user_id' => $userId,
                ...$data,
            ]);
        });

        return response()->json(['message' => 'Permintaan penarikan berhasil dikirim.', 'data' => $this->shape($withdrawal)], 201);
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
        ];
    }
}
