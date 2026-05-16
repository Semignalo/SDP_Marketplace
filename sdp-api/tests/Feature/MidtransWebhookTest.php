<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class MidtransWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function makeOrder(array $overrides = []): Order
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        return Order::create(array_merge([
            'user_id' => $user->id,
            'order_number' => 'SDP-TEST-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 100000,
            'shipping_cost' => 10000,
            'total' => 110000,
            'shipping_name' => 'Test',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
        ], $overrides));
    }

    private function mockMidtrans(array $resolveReturn): void
    {
        $this->mock(MidtransService::class, function (MockInterface $mock) use ($resolveReturn) {
            $mock->shouldReceive('resolveNotification')->andReturn($resolveReturn);
        });
    }

    public function test_settlement_marks_order_processing_and_verifies_payment(): void
    {
        $order = $this->makeOrder();

        $this->mockMidtrans([
            'order_number' => $order->order_number,
            'transaction_status' => 'settlement',
            'fraud_status' => null,
            'next_status' => 'processing',
        ]);

        $response = $this->postJson('/api/payments/notification', []);

        $response->assertOk();
        $fresh = $order->fresh();
        $this->assertEquals('processing', $fresh->status);
        $this->assertNotNull($fresh->payment_verified_at);
    }

    public function test_expire_marks_order_cancelled(): void
    {
        $order = $this->makeOrder();

        $this->mockMidtrans([
            'order_number' => $order->order_number,
            'transaction_status' => 'expire',
            'fraud_status' => null,
            'next_status' => 'cancelled',
        ]);

        $this->postJson('/api/payments/notification', [])->assertOk();
        $this->assertEquals('cancelled', $order->fresh()->status);
    }

    public function test_pending_does_not_change_status(): void
    {
        $order = $this->makeOrder();

        $this->mockMidtrans([
            'order_number' => $order->order_number,
            'transaction_status' => 'pending',
            'fraud_status' => null,
            'next_status' => null,
        ]);

        $this->postJson('/api/payments/notification', [])->assertOk();
        $this->assertEquals('pending_payment', $order->fresh()->status);
    }

    public function test_webhook_returns_404_for_unknown_order(): void
    {
        $this->mockMidtrans([
            'order_number' => 'NOT-EXISTS',
            'transaction_status' => 'settlement',
            'fraud_status' => null,
            'next_status' => 'processing',
        ]);

        $this->postJson('/api/payments/notification', [])->assertNotFound();
    }

    public function test_webhook_idempotent_does_not_revert_completed(): void
    {
        $order = $this->makeOrder(['status' => 'completed']);

        $this->mockMidtrans([
            'order_number' => $order->order_number,
            'transaction_status' => 'cancel',
            'fraud_status' => null,
            'next_status' => 'cancelled',
        ]);

        $this->postJson('/api/payments/notification', [])->assertOk();
        // status tidak boleh berubah dari completed
        $this->assertEquals('completed', $order->fresh()->status);
    }

    public function test_cancelled_order_also_cancels_pending_commission(): void
    {
        $order = $this->makeOrder();
        $referrer = User::factory()->create();
        $commission = ResellerCommission::create([
            'reseller_id' => $referrer->id,
            'order_id' => $order->id,
            'customer_id' => $order->user_id,
            'order_total' => 100000,
            'rate' => 10,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $this->mockMidtrans([
            'order_number' => $order->order_number,
            'transaction_status' => 'expire',
            'fraud_status' => null,
            'next_status' => 'cancelled',
        ]);

        $this->postJson('/api/payments/notification', [])->assertOk();
        $this->assertEquals('cancelled', $commission->fresh()->status);
    }

    public function test_snap_token_endpoint_returns_503_when_not_configured(): void
    {
        $this->mock(MidtransService::class, function (MockInterface $mock) {
            $mock->shouldReceive('isConfigured')->andReturn(false);
        });

        $user = User::factory()->create();
        $order = $this->makeOrder(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertStatus(503)
            ->assertJsonPath('configured', false);
    }

    public function test_snap_token_endpoint_rejects_non_pending_order(): void
    {
        $user = User::factory()->create();
        $order = $this->makeOrder(['user_id' => $user->id, 'status' => 'processing']);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertStatus(422);
    }
}
