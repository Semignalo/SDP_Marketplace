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
        Setting::set('shipping_max_free', '20000');
        // Reset tier defaults supaya tier discount tidak ikut campur di test ini
        // (tier_1 Member 0%, semua tier diatas tidak tercapai untuk user baru)
        Setting::set('tier_1_name', 'Member');
        Setting::set('tier_1_min_spend', '0');
        Setting::set('tier_1_discount', '0');
        Setting::set('tier_2_min_spend', '999999999');
        Setting::set('tier_3_min_spend', '999999999');
        Setting::set('tier_4_min_spend', '999999999');
        Setting::set('tier_5_min_spend', '999999999');
    }

    public function test_checkout_options_returns_shipping_threshold(): void
    {
        $response = $this->getJson('/api/checkout/options');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['shipping_min_free', 'shipping_max_free']]);
    }

    public function test_authenticated_user_can_create_order(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 50000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'Test Recipient',
            'shipping_phone' => '08123456789',
            'shipping_address' => 'Jl. Test No. 1',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.subtotal', 100000)
            ->assertJsonPath('data.shipping_cost', 16000) // 100k < 150k threshold
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
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
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
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        // subtotal 200k >= 150k threshold → subsidi max 20k, ongkir 16k − 20k = 0
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
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 5]],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(2, $product->fresh()->stock);
    }

    public function test_order_rejected_when_courier_name_missing(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['courier_name']);
    }

    public function test_referrer_creates_commission_pending(): void
    {
        // Phase 16: referral ditetapkan via referrer_id saat registrasi, bukan lewat request order.
        $referrer = User::factory()->create(['reseller_code' => 'TESTREFR']);
        $user = User::factory()->create(['referrer_id' => $referrer->id]);
        $product = Product::factory()->create(['price' => 100000, 'stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
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

    public function test_user_without_referrer_creates_no_commission(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
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
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(401);
    }
}
