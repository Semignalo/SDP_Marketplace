<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'causer_id' => 'nullable|integer|exists:users,id',
            'log_name' => 'nullable|string|max:60',
            'search' => 'nullable|string|max:160',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $items = $this->filteredQuery($request)
            ->with('causer:id,name,email,role')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => collect($items->items())->map(fn ($a) => $this->shape($a)),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'causer_id' => 'nullable|integer|exists:users,id',
            'log_name' => 'nullable|string|max:60',
            'search' => 'nullable|string|max:160',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $rows = $this->filteredQuery($request)
            ->with('causer:id,name,email,role')
            ->orderByDesc('created_at')
            ->limit(10000)
            ->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Waktu', 'Pengguna', 'Peran', 'Log', 'Deskripsi', 'IP']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->created_at,
                    $r->causer?->name ?? 'Guest/System',
                    $r->properties['causer_role'] ?? '-',
                    $r->log_name,
                    $r->description,
                    $r->properties['ip_address'] ?? '-',
                ]);
            }
            fclose($out);
        }, 'activity-logs-' . now()->format('Ymd-His') . '.csv');
    }

    private function filteredQuery(Request $request)
    {
        $query = Activity::query();

        if ($request->filled('causer_id')) {
            $query->where('causer_id', $request->input('causer_id'));
        }
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->input('log_name'));
        }
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->input('search') . '%');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return $query;
    }

    private function shape(Activity $a): array
    {
        return [
            'id' => $a->id,
            'log_name' => $a->log_name,
            'description' => $a->description,
            'subject_type' => $a->subject_type ? class_basename($a->subject_type) : null,
            'subject_id' => $a->subject_id,
            'causer' => $a->causer ? ['id' => $a->causer->id, 'name' => $a->causer->name, 'email' => $a->causer->email] : null,
            'causer_role' => $a->properties['causer_role'] ?? null,
            'ip_address' => $a->properties['ip_address'] ?? null,
            'properties' => collect($a->properties)->except(['causer_role', 'ip_address'])->toArray(),
            'created_at' => $a->created_at?->toIso8601String(),
        ];
    }
}
