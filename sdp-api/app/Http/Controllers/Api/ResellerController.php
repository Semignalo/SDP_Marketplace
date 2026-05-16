<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResellerCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $base = ResellerCommission::where('reseller_id', $user->id);

        return response()->json([
            'data' => [
                'total_earned' => (float) (clone $base)->sum('amount'),
                'pending' => (float) (clone $base)->where('status', 'pending')->sum('amount'),
                'earned' => (float) (clone $base)->where('status', 'earned')->sum('amount'),
                'paid' => (float) (clone $base)->where('status', 'paid')->sum('amount'),
                'orders_count' => (clone $base)->count(),
                'customers_count' => (clone $base)->distinct('customer_id')->count('customer_id'),
                'reseller_code' => $user->reseller_code,
                'rate' => (float) \App\Models\Setting::get('reseller_commission_rate', 10),
            ],
        ]);
    }

    public function commissions(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:pending,earned,paid,cancelled',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = ResellerCommission::where('reseller_id', $request->user()->id)
            ->with(['order:id,order_number,status,total,created_at', 'customer:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $items = $query->paginate($request->input('per_page', 15))->withQueryString();

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

}
