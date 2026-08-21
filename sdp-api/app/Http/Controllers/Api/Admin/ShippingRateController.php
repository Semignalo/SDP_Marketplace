<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingRate;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * CRUD rate ongkir internasional — dipakai InternationalShippingService buat auto-quote
 * saat checkout (lihat InternationalShippingService::quote()). Order internasional yang
 * negaranya TIDAK punya rate aktif di sini tetap jatuh ke awaiting_quote (manual), sama
 * seperti sebelum fitur ini ada — jadi menambah/menghapus rate di sini tidak pernah
 * bikin checkout gagal, cuma menentukan otomatis atau manual.
 */
class ShippingRateController extends Controller
{
    public function index(): JsonResponse
    {
        $rates = ShippingRate::query()
            ->orderBy('country')
            ->orderBy('weight_kg')
            ->get()
            ->map(fn (ShippingRate $r) => $this->shape($r));

        return response()->json(['data' => $rates]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $this->assertNoDuplicate($data);

        $rate = ShippingRate::create($data);

        ActivityLogger::log(
            'shipping_rate',
            "Rate ongkir {$rate->country} ({$rate->weight_kg}kg) ditambahkan oleh {$request->user()->name}",
            $request->user(),
            $rate,
        );

        return response()->json(['message' => 'Shipping rate added', 'data' => $this->shape($rate)], 201);
    }

    public function update(Request $request, ShippingRate $shippingRate): JsonResponse
    {
        $data = $this->validated($request);
        $this->assertNoDuplicate($data, $shippingRate->id);

        $shippingRate->update($data);

        ActivityLogger::log(
            'shipping_rate',
            "Rate ongkir {$shippingRate->country} ({$shippingRate->weight_kg}kg) diubah oleh {$request->user()->name}",
            $request->user(),
            $shippingRate,
        );

        return response()->json(['message' => 'Shipping rate updated', 'data' => $this->shape($shippingRate)]);
    }

    public function destroy(Request $request, ShippingRate $shippingRate): JsonResponse
    {
        $label = "{$shippingRate->country} ({$shippingRate->weight_kg}kg)";
        $shippingRate->delete();

        ActivityLogger::log(
            'shipping_rate',
            "Rate ongkir {$label} dihapus oleh {$request->user()->name}",
            $request->user(),
        );

        return response()->json(['message' => 'Shipping rate deleted']);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'country' => 'required|string|max:60',
            'country_code' => 'nullable|string|max:3',
            'zone' => 'nullable|string|max:60',
            // Default besar (999kg) kalau admin belum punya data bertingkat —
            // artinya "berlaku untuk berat berapapun", bukan tier sungguhan.
            'weight_kg' => 'required|numeric|min:0.01|max:999',
            'length_cm' => 'nullable|numeric|min:0|max:999',
            'width_cm' => 'nullable|numeric|min:0|max:999',
            'height_cm' => 'nullable|numeric|min:0|max:999',
            'service' => 'required|string|max:20',
            'term' => 'required|string|max:10',
            'base_rate' => 'required|integer|min:0',
            'fsc_percent' => 'nullable|numeric|min:0|max:100',
            'esc_amount' => 'nullable|integer|min:0',
            'add_fee_custom' => 'nullable|integer|min:0',
            'ogb_fee' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        /*
         * Field opsional yang di-omit HARUS jadi 0, bukan diserahkan ke default kolom DB —
         * fsc_percent defaultnya 10 di migration (bekas struktur data OGB lama), yang bikin
         * rate baru diam-diam kena markup 10% kalau admin sengaja kosongkan field ini.
         */
        foreach (['fsc_percent', 'esc_amount', 'add_fee_custom', 'ogb_fee'] as $feeField) {
            $data[$feeField] = $data[$feeField] ?? 0;
        }
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }

    /**
     * Cocokkan by `country` (nama lengkap) + weight_kg + service + term — itu kombinasi
     * yang BENERAN dipakai InternationalShippingService::quote() buat mencari rate saat
     * checkout. Constraint unique di migration berdasarkan `country_code` (nullable) TIDAK
     * cukup: dua baris dengan country_code kosong tidak dianggap duplikat oleh MySQL,
     * padahal `country`-nya sama — makanya dicek manual di sini, bukan cuma andalkan DB.
     */
    private function assertNoDuplicate(array $data, ?int $ignoreId = null): void
    {
        $exists = ShippingRate::query()
            ->whereRaw('UPPER(country) = ?', [strtoupper(trim($data['country']))])
            // `where('zone', null)` otomatis jadi whereNull — negara tanpa zona (mayoritas)
            // tetap kebandingkan dengan benar, bukan cuma negara yang punya banyak zona (mis. Malaysia).
            ->where('zone', $data['zone'] ?? null)
            ->where('weight_kg', $data['weight_kg'])
            ->where('service', $data['service'])
            ->where('term', $data['term'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'country' => ['A rate for this country, weight, and service/term combination already exists.'],
            ]);
        }
    }

    private function shape(ShippingRate $r): array
    {
        return [
            'id' => $r->id,
            'country' => $r->country,
            'country_code' => $r->country_code,
            'zone' => $r->zone,
            'weight_kg' => (float) $r->weight_kg,
            'length_cm' => $r->length_cm !== null ? (float) $r->length_cm : null,
            'width_cm' => $r->width_cm !== null ? (float) $r->width_cm : null,
            'height_cm' => $r->height_cm !== null ? (float) $r->height_cm : null,
            'service' => $r->service,
            'term' => $r->term,
            'base_rate' => (int) $r->base_rate,
            'fsc_percent' => (float) $r->fsc_percent,
            'esc_amount' => (int) $r->esc_amount,
            'add_fee_custom' => (int) $r->add_fee_custom,
            'ogb_fee' => (int) $r->ogb_fee,
            // Total yang benar-benar dipakai InternationalShippingService::quote() —
            // biar admin lihat angka final, bukan cuma base_rate mentah.
            'final_price' => $r->final_price,
            'notes' => $r->notes,
            'is_active' => (bool) $r->is_active,
            'updated_at' => $r->updated_at?->toIso8601String(),
        ];
    }
}
