<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\MetaCapiService;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery\MockInterface;
use Tests\TestCase;

class MetaAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::set('shipping_min_free', '150000');
        Setting::set('shipping_max_free', '20000');
    }

    private function guestPayload(Product $product, array $attribution = []): array
    {
        return [
            'guest_email' => 'Buyer@Example.com',
            'shipping_name' => 'Buyer',
            'shipping_phone' => '0812-3456-7890',
            'shipping_address' => 'Jl. Test 1',
            'shipping_country' => 'Indonesia',
            'province' => 'DKI Jakarta',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'attribution' => $attribution,
        ];
    }

    private function enableCapi(): void
    {
        Setting::set('meta_pixel_id', '123456789');
        config()->set('services.meta.capi_access_token', 'test-token');
        config()->set('services.meta.test_event_code', '');
    }

    private function makePaidOrder(array $overrides = []): Order
    {
        $product = Product::factory()->create(['stock' => 10]);
        $order = Order::create(array_merge([
            'guest_email' => 'Buyer@Example.com',
            'order_number' => 'SDP-META-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 100000,
            'shipping_cost' => 10000,
            'total' => 110000,
            'shipping_name' => 'Buyer',
            'shipping_phone' => '0812-3456-7890',
            'shipping_country' => 'Indonesia',
            'shipping_address' => 'X',
            'client_ip' => '203.0.113.5',
            'client_user_agent' => 'PHPUnit',
            'fbp' => 'fb.1.1700000000000.123',
        ], $overrides));

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'vendor_id' => $product->vendor_id,
            'product_name' => $product->name,
            'price' => 100000,
            'quantity' => 2,
            'subtotal' => 200000,
        ]);

        return $order;
    }

    public function test_guest_order_stores_attribution_and_browser_context(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000]);

        $this->withHeader('User-Agent', 'TestBrowser/1.0')
            ->postJson('/api/guest/orders', $this->guestPayload($product, [
                'utm_source' => 'meta',
                'utm_medium' => 'paid',
                'utm_campaign' => '120210000000001',
                'utm_content' => '120210000000002',
                'fbclid' => 'IwAR-abc',
                'fbp' => 'fb.1.1700000000000.111',
                'landing_url' => 'https://example.test/?utm_source=meta',
                'captured_at' => now()->subDay()->getTimestampMs(),
            ]))
            ->assertCreated();

        $order = Order::firstOrFail();
        $this->assertSame('meta', $order->utm_source);
        $this->assertSame('120210000000001', $order->utm_campaign);
        $this->assertSame('IwAR-abc', $order->fbclid);
        $this->assertSame('fb.1.1700000000000.111', $order->fbp);
        $this->assertNotNull($order->attributed_at);
        $this->assertSame('TestBrowser/1.0', $order->client_user_agent);
        $this->assertNotNull($order->client_ip);
    }

    public function test_order_without_attribution_is_direct(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000]);

        $this->postJson('/api/guest/orders', $this->guestPayload($product))->assertCreated();

        $order = Order::firstOrFail();
        $this->assertNull($order->utm_source);
        $this->assertNull($order->attributed_at);
    }

    public function test_attribution_older_than_seven_days_is_dropped(): void
    {
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000]);

        $this->postJson('/api/guest/orders', $this->guestPayload($product, [
            'utm_source' => 'meta',
            'utm_campaign' => 'old',
            'captured_at' => now()->subDays(8)->getTimestampMs(),
        ]))->assertCreated();

        $order = Order::firstOrFail();
        $this->assertNull($order->utm_campaign);
        $this->assertNull($order->attributed_at);
    }

    public function test_confirm_payment_endpoint_no_longer_exists(): void
    {
        $user = User::factory()->create();
        $order = $this->makePaidOrder(['user_id' => $user->id, 'guest_email' => null]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/confirm-payment")
            ->assertNotFound();

        $this->assertSame('pending_payment', $order->fresh()->status);
    }

    public function test_purchase_sent_once_to_capi_when_webhook_marks_paid(): void
    {
        $this->enableCapi();
        Http::fake(['graph.facebook.com/*' => Http::response(['events_received' => 1], 200)]);

        $order = $this->makePaidOrder([
            'utm_source' => 'meta',
            'fbclid' => 'IwAR-abc',
            'attributed_at' => now()->subHour(),
        ]);

        $this->mock(MidtransService::class, function (MockInterface $mock) use ($order) {
            $mock->shouldReceive('resolveNotification')->andReturn([
                'order_number' => $order->order_number,
                'transaction_status' => 'settlement',
                'fraud_status' => null,
                'next_status' => 'processing',
            ]);
        });

        $this->postJson('/api/payments/notification', [])->assertOk();

        Http::assertSentCount(1);
        Http::assertSent(function ($request) use ($order) {
            $event = $request['data'][0];

            return str_contains($request->url(), '/123456789/events')
                && $event['event_name'] === 'Purchase'
                && $event['event_id'] === 'purchase-' . $order->order_number
                && $event['custom_data']['currency'] === 'IDR'
                && $event['custom_data']['value'] === 110000.0
                && $event['custom_data']['num_items'] === 2
                // email di-lowercase lalu SHA-256; nomor lokal 0812… jadi 62812…
                && $event['user_data']['em'] === hash('sha256', 'buyer@example.com')
                && $event['user_data']['ph'] === hash('sha256', '6281234567890')
                && $event['user_data']['client_ip_address'] === '203.0.113.5'
                && str_starts_with($event['user_data']['fbc'], 'fb.1.')
                && $request->hasHeader('Authorization', 'Bearer test-token');
        });

        $this->assertNotNull($order->fresh()->capi_purchase_sent_at);

        // Update status berikutnya (shipped, dst.) tidak mengirim ulang.
        $order->fresh()->update(['status' => 'shipped']);
        $this->app->terminate();
        Http::assertSentCount(1);
    }

    public function test_purchase_not_sent_when_capi_unconfigured(): void
    {
        Http::fake();

        $order = $this->makePaidOrder();
        $order->update(['status' => 'processing', 'payment_verified_at' => now()]);
        $this->app->terminate();

        Http::assertNothingSent();
        $this->assertNull($order->fresh()->capi_purchase_sent_at);
    }

    public function test_failed_capi_call_does_not_mark_sent_and_can_be_resent(): void
    {
        $this->enableCapi();
        // Percobaan pertama ditolak Meta, percobaan kedua (resend) berhasil.
        Http::fake(['graph.facebook.com/*' => Http::sequence()
            ->push(['error' => 'x'], 500)
            ->push(['events_received' => 1], 200)]);

        $order = $this->makePaidOrder();
        $order->update(['status' => 'processing', 'payment_verified_at' => now()]);
        $this->app->terminate();

        $this->assertNull($order->fresh()->capi_purchase_sent_at);

        $this->artisan('meta:capi-resend')->assertSuccessful();

        $this->assertNotNull($order->fresh()->capi_purchase_sent_at);
    }

    public function test_purchase_event_id_matches_browser_pixel_convention(): void
    {
        $order = $this->makePaidOrder(['order_number' => 'SDP-ABC-1']);

        $this->assertSame('purchase-SDP-ABC-1', MetaCapiService::purchaseEventId($order));
    }

    public function test_attribution_report_groups_orders_and_joins_meta_spend(): void
    {
        config()->set('services.meta.ads_access_token', 'ads-token');
        config()->set('services.meta.ad_account_id', 'act_999');

        Http::fake(['graph.facebook.com/*' => Http::response([
            'data' => [
                ['campaign_id' => '111', 'campaign_name' => 'Spring Sale', 'ad_id' => '901', 'ad_name' => 'Video A', 'spend' => '50000', 'account_currency' => 'IDR'],
                ['campaign_id' => '222', 'campaign_name' => 'No Sales Yet', 'ad_id' => '902', 'ad_name' => 'Static B', 'spend' => '20000', 'account_currency' => 'IDR'],
            ],
        ], 200)]);

        // Order beriklan (campaign ID Meta) + order via link Linktree (nama campaign statis) + direct.
        $this->makePaidOrder(['status' => 'processing', 'utm_source' => 'meta', 'utm_campaign' => '111', 'utm_content' => '901', 'attributed_at' => now()]);
        $this->makePaidOrder(['status' => 'completed', 'utm_source' => 'meta', 'utm_campaign' => 'spring-sale', 'attributed_at' => now()]);
        $this->makePaidOrder(['status' => 'processing']);
        // Belum dibayar → tidak dihitung.
        $this->makePaidOrder(['status' => 'pending_payment', 'utm_source' => 'meta', 'utm_campaign' => '111', 'attributed_at' => now()]);

        $admin = User::factory()->create(['role' => 'admin']);
        $data = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/attribution?days=7')
            ->assertOk()
            ->json('data');

        $this->assertSame('ok', $data['spend_status']);
        $this->assertSame(3, $data['totals']['orders']);
        $this->assertSame(2, $data['totals']['ad_orders']);
        $this->assertSame(1, $data['totals']['direct_orders']);
        $this->assertEquals(70000, $data['totals']['spend']);

        $byName = collect($data['campaigns'])->keyBy('name');

        // Order dengan ID "111" dan nama statis "spring-sale" jatuh ke campaign Meta yang sama,
        // tapi karena key UTM-nya beda, tampil sebagai dua baris — spend hanya di baris ID.
        $this->assertTrue($byName->has('Spring Sale'));
        $this->assertTrue($byName->has('No Sales Yet'));
        $this->assertSame(0, $byName['No Sales Yet']['orders']);
        $this->assertEquals(20000, $byName['No Sales Yet']['spend']);
    }

    public function test_attribution_report_works_without_meta_credentials(): void
    {
        $this->makePaidOrder(['status' => 'processing', 'utm_source' => 'meta', 'utm_campaign' => 'linktree-ig', 'attributed_at' => now()]);

        $admin = User::factory()->create(['role' => 'admin']);
        $data = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/attribution?days=7')
            ->assertOk()
            ->json('data');

        $this->assertSame('not_configured', $data['spend_status']);
        $this->assertNull($data['totals']['spend']);
        $this->assertSame('linktree-ig', $data['campaigns'][0]['name']);
        $this->assertSame(1, $data['campaigns'][0]['orders']);
    }

    public function test_attribution_report_is_admin_only(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->getJson('/api/admin/attribution')->assertForbidden();
    }
}
