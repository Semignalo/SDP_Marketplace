<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ResellerCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|in:pending,earned,paid,cancelled',
            'reseller_id' => 'nullable|integer|exists:users,id',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = ResellerCommission::query()
            ->with(['reseller:id,name,email,reseller_code', 'customer:id,name', 'order:id,order_number,status'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('reseller_id')) {
            $query->where('reseller_id', $request->input('reseller_id'));
        }
        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->whereHas('reseller', fn ($r) => $r->where('name', 'like', $search))
                  ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', $search));
            });
        }

        $items = $query->paginate($request->input('per_page', 20))->withQueryString();

        $sums = ResellerCommission::selectRaw('
                SUM(amount) as total,
                SUM(CASE WHEN status = "pending" THEN amount ELSE 0 END) as pending,
                SUM(CASE WHEN status = "earned" THEN amount ELSE 0 END) as earned,
                SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END) as paid
            ')
            ->first();

        $summary = [
            'total' => (float) ($sums->total ?? 0),
            'pending' => (float) ($sums->pending ?? 0),
            'earned' => (float) ($sums->earned ?? 0),
            'paid' => (float) ($sums->paid ?? 0),
        ];

        return response()->json([
            'data' => collect($items->items())->map(fn ($c) => $this->shape($c)),
            'summary' => $summary,
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function updateStatus(Request $request, ResellerCommission $commission): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending,earned,paid,cancelled',
        ]);

        $payload = ['status' => $data['status']];
        if ($data['status'] === 'paid') {
            $payload['paid_at'] = now();
        } elseif ($commission->status === 'paid' && $data['status'] !== 'paid') {
            $payload['paid_at'] = null;
        }

        $commission->update($payload);

        return response()->json(['message' => 'Status komisi diperbarui', 'data' => $this->shape($commission->fresh(['reseller:id,name,email,reseller_code', 'customer:id,name', 'order:id,order_number,status']))]);
    }

    public function bulkMarkPaid(Request $request): JsonResponse
    {
        $data = $request->validate([
            'commission_ids' => 'required|array|min:1',
            'commission_ids.*' => 'integer|exists:reseller_commissions,id',
        ]);

        $count = ResellerCommission::whereIn('id', $data['commission_ids'])
            ->whereIn('status', ['pending', 'earned'])
            ->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json(['message' => "{$count} komisi ditandai paid"]);
    }

    private function shape(ResellerCommission $c): array
    {
        return [
            'id' => $c->id,
            'order_total' => (float) $c->order_total,
            'rate' => (float) $c->rate,
            'amount' => (float) $c->amount,
            'status' => $c->status,
            'paid_at' => $c->paid_at?->toIso8601String(),
            'created_at' => $c->created_at?->toIso8601String(),
            'reseller' => $c->reseller ? ['id' => $c->reseller->id, 'name' => $c->reseller->name, 'email' => $c->reseller->email, 'reseller_code' => $c->reseller->reseller_code] : null,
            'customer' => $c->customer ? ['id' => $c->customer->id, 'name' => $c->customer->name] : null,
            'order' => $c->order ? ['id' => $c->order->id, 'order_number' => $c->order->order_number, 'status' => $c->order->status] : null,
        ];
    }
}
