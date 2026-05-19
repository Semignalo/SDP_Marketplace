<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommissionWithdrawal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            return response()->json(['message' => 'Permintaan ini sudah diproses.'], 422);
        }

        $withdrawal->update([
            'status'       => $data['status'],
            'admin_notes'  => $data['admin_notes'] ?? null,
            'processed_at' => now(),
        ]);

        return response()->json(['message' => 'Status penarikan diperbarui.', 'data' => $this->shape($withdrawal->fresh('user'))]);
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
