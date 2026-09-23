<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Kirim event Purchase ke Meta Conversions API saat order terbayar.
 *
 * Best-effort: tidak pernah melempar exception — pembayaran tidak boleh gagal
 * gara-gara Meta down. event_id = "purchase-{order_number}", sama dengan Pixel di
 * browser, supaya Meta men-dedupe keduanya.
 */
class MetaCapiService
{
    public function isConfigured(): bool
    {
        return $this->pixelId() !== '' && (string) config('services.meta.capi_access_token') !== '';
    }

    public static function purchaseEventId(Order $order): string
    {
        return 'purchase-' . $order->order_number;
    }

    /**
     * Kirim Purchase untuk order. Return true kalau Meta menerima (atau tidak perlu kirim
     * karena sudah pernah terkirim); false kalau dilewati/gagal.
     */
    public function sendPurchase(Order $order): bool
    {
        if ($order->capi_purchase_sent_at !== null || ! $this->isConfigured()) {
            return false;
        }

        try {
            $order->loadMissing(['items', 'customer']);

            $payload = [
                'data' => [$this->buildPurchaseEvent($order)],
            ];

            $testCode = (string) config('services.meta.test_event_code');
            if ($testCode !== '') {
                $payload['test_event_code'] = $testCode;
            }

            $version = config('services.meta.graph_version', 'v21.0');
            // Workaround SSL cert untuk Windows/Laragon dev — tidak dipakai di production.
            $http = Http::timeout(8)->withToken((string) config('services.meta.capi_access_token'));
            if (app()->environment('local')) {
                $http = $http->withoutVerifying();
            }

            $response = $http->post("https://graph.facebook.com/{$version}/{$this->pixelId()}/events", $payload);

            if (! $response->successful()) {
                Log::warning('Meta CAPI Purchase rejected', [
                    'order' => $order->order_number,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            // saveQuietly: jangan memicu observer lagi.
            $order->forceFill(['capi_purchase_sent_at' => now()])->saveQuietly();

            return true;
        } catch (Throwable $e) {
            Log::warning('Meta CAPI Purchase failed', [
                'order' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /** @return array<string, mixed> */
    public function buildPurchaseEvent(Order $order): array
    {
        $email = $order->guest_email ?: $order->customer?->email;

        $userData = array_filter([
            'em' => $this->hashed($this->normalizeEmail($email)),
            'ph' => $this->hashed($this->normalizePhone($order->shipping_phone, $order->shipping_country)),
            'external_id' => $this->hashed($order->user_id ? 'user-' . $order->user_id : $this->normalizeEmail($email)),
            'fbc' => $order->fbc ?: $this->fbcFromClickId($order),
            'fbp' => $order->fbp,
            'client_ip_address' => $order->client_ip,
            'client_user_agent' => $order->client_user_agent,
        ], fn ($v) => $v !== null && $v !== '' && $v !== []);

        $contents = $order->items->map(fn ($item) => [
            'id' => (string) $item->product_id,
            'quantity' => (int) $item->quantity,
            'item_price' => (float) $item->price,
        ])->values()->all();

        // event_time = saat pembayaran terverifikasi. Meta menolak event > 7 hari.
        $paidAt = $order->payment_verified_at ?? now();

        return [
            'event_name' => 'Purchase',
            'event_time' => $paidAt->getTimestamp(),
            'event_id' => self::purchaseEventId($order),
            'action_source' => 'website',
            'event_source_url' => $order->landing_url ?: rtrim((string) config('services.meta.site_url'), '/'),
            'user_data' => $userData,
            'custom_data' => [
                // Selalu IDR (mata uang yang ditagih Midtrans), bukan mata uang tampilan regional.
                'currency' => 'IDR',
                'value' => (float) $order->total,
                'order_id' => $order->order_number,
                'content_type' => 'product',
                'contents' => $contents,
                'num_items' => (int) $order->items->sum('quantity'),
            ],
        ];
    }

    private function pixelId(): string
    {
        return trim((string) Setting::get('meta_pixel_id', ''));
    }

    /** fbc dibentuk dari fbclid kalau browser tidak sempat mengirim cookie _fbc. */
    private function fbcFromClickId(Order $order): ?string
    {
        if (! $order->fbclid) {
            return null;
        }

        $clickedAt = ($order->attributed_at ?? $order->created_at ?? now())->getTimestampMs();

        return "fb.1.{$clickedAt}.{$order->fbclid}";
    }

    private function normalizeEmail(?string $email): ?string
    {
        $email = $email !== null ? strtolower(trim($email)) : null;

        return $email === '' ? null : $email;
    }

    /** Digit saja, dengan kode negara. Nomor lokal Indonesia (0812…) → 62812…. */
    private function normalizePhone(?string $phone, ?string $country): ?string
    {
        if ($phone === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        } elseif (str_starts_with($digits, '0') && strcasecmp(trim((string) $country), 'Indonesia') === 0) {
            $digits = '62' . substr($digits, 1);
        }

        return $digits;
    }

    /** SHA-256 hex; Meta mensyaratkan data pribadi di-hash sebelum dikirim. */
    private function hashed(?string $value): ?string
    {
        return $value === null || $value === '' ? null : hash('sha256', $value);
    }
}
