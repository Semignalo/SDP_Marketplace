<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::set('reseller_commission_rate', '10');
        Setting::set('shipping_min_free', '150000');
    }

    public function test_checkout_options_returns_couriers_and_threshold(): void
    {
        $response = $this->getJson('/api/checkout/options');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['couriers' => [['code', 'name', 'cost']], 'shipping_min_free']]);
    }

    public function test_authenticated_user_can_create_order(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 50000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'Test Recipient',
            'shipping_phone' => '08123456789',
            'shipping_address' => 'Jl. Test No. 1',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.subtotal', 100000)
            ->assertJsonPath('data.shipping_cost', 16000) // jnt_reg cost, 100k < 150k threshold
            ->assertJsonPath('data.total', 116000);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'pending_payment',
            'subtotal' => 100000,
        ]);
    }

    public function test_order_decrements_product_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertCreated();

        $this->assertEquals(7, $product->fresh()->stock);
    }

    public function test_free_shipping_applied_above_threshold(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 200000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.shipping_cost', 0)
            ->assertJsonPath('data.total', 200000);
    }

    public function test_order_rejected_when_stock_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 2]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 5]],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(2, $product->fresh()->stock); // stock unchanged
    }

    public function test_order_rejected_for_invalid_courier(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'unknown_courier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['courier']);
    }

    public function test_referrer_code_creates_commission_pending(): void
    {
        $user = User::factory()->create();
        $referrer = User::factory()->create(['reseller_code' => 'TESTREFR']);
        $product = Product::factory()->create(['price' => 100000, 'stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'reseller_code' => 'TESTREFR',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertCreated();

        $this->assertDatabaseHas('reseller_commissions', [
            'reseller_id' => $referrer->id,
            'customer_id' => $user->id,
            'rate' => 10,
            'amount' => 20000, // 10% of 200000 subtotal
            'status' => 'pending',
        ]);
    }

    public function test_invalid_reseller_code_ignored_silently(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'reseller_code' => 'INVALIDXYZ',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertDatabaseCount('reseller_commissions', 0);
        $this->assertDatabaseHas('orders', ['reseller_id' => null]);
    }

    public function test_unauthenticated_user_cannot_create_order(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $this->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(401);
    }

}
