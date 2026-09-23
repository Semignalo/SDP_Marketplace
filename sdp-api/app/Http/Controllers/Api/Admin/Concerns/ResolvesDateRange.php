<?php

namespace App\Http\Controllers\Api\Admin\Concerns;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

trait ResolvesDateRange
{
    /**
     * Resolve rentang tanggal dari request: date_from/date_to eksplisit (menang), atau 'days' terakhir
     * (default 30). Dipakai bareng oleh summary() & revenueChart() biar filter dashboard konsisten.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveDateRange(Request $request): array
    {
        $data = $request->validate([
            'all' => 'nullable|boolean',
            'days' => 'nullable|integer|min:1|max:366',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $end = now()->startOfDay();
        // Batas pengaman absolut biar loop generate series gak kebablasan (10 tahun cukup jauh).
        $maxSpanDays = 3650;

        if ($request->boolean('all')) {
            $earliest = Order::whereNull('archived_at')->oldest('created_at')->value('created_at');
            $start = $earliest ? Carbon::parse($earliest)->startOfDay() : $end->copy()->subDays(30);
            if ($start->diffInDays($end) > $maxSpanDays) {
                $start = $end->copy()->subDays($maxSpanDays);
            }
        } elseif (! empty($data['date_from']) && ! empty($data['date_to'])) {
            $start = Carbon::parse($data['date_from'])->startOfDay();
            $end = Carbon::parse($data['date_to'])->startOfDay();
            // Batasi maks 1 tahun biar gak query/loop kebablasan kalau ada input tanggal aneh.
            if ($start->diffInDays($end) > 366) {
                $start = $end->copy()->subDays(366);
            }
        } else {
            $days = max(1, min(366, (int) ($data['days'] ?? 30)));
            $start = $end->copy()->subDays($days - 1);
        }

        return [$start, $end];
    }
}
