<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\TierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed tier defaults
        $defaults = [
            'tier_1_name' => 'Member',   'tier_1_min_spend' => '5000000',  'tier_1_discount' => '10',
            'tier_2_name' => 'Silver',   'tier_2_min_spend' => '10000000', 'tier_2_discount' => '15',
            'tier_3_name' => 'Gold',     'tier_3_min_spend' => '15000000', 'tier_3_discount' => '20',
            'tier_4_name' => 'Platinum', 'tier_4_min_spend' => '20000000', 'tier_4_discount' => '25',
            'tier_5_name' => 'VIP',      'tier_5_min_spend' => '25000000', 'tier_5_discount' => '30',
            'shipping_min_free' => '150000',
            'reseller_commission_rate' => '10',
        ];
        foreach ($defaults as $k => $v) Setting::set($k, $v);
    }

    private function makeCompletedOrder(User $user, float $subtotal): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'order_number' => 'SDP-T-' . uniqid(),
            'status' => 'completed',
            'subtotal' => $subtotal,
            'shipping_cost' => 0,
            'total' => $subtotal,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
        ]);
    }

    public function test_user_with_no_completed_orders_has_no_tier(): void
    {
        $user = User::factory()->create();
        $svc = app(TierService::class);

        $this->assertEquals(0, $svc->userSpending($user));
        $this->assertNull($svc->userTier($user));
        $this->assertEquals('Member', $svc->nextTier($user)['name']);
    }

    public function test_user_in_tier_1_after_5jt_spending(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 5_500_000);

        $tier = app(TierService::class)->userTier($user);
        $this->assertEquals('Member', $tier['name']);
        $this->assertEquals(10, $tier['discount']);
    }

    public function test_user_in_tier_3_after_15jt_spending(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 15_000_000);

        $tier = app(TierService::class)->userTier($user);
        $this->assertEquals('Gold', $tier['name']);
        $this->assertEquals(20, $tier['discount']);
    }

    public function test_user_at_top_tier_has_no_next_tier(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 30_000_000);

        $svc = app(TierService::class);
        $this->assertEquals('VIP', $svc->userTier($user)['name']);
        $this->assertNull($svc->nextTier($user));
    }

    public function test_only_completed_orders_count_for_spending(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 5_000_000);

        // pending_payment & cancelled tidak dihitung
        Order::create([
            'user_id' => $user->id,
            'order_number' => 'SDP-P-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 999_999_999,
            'shipping_cost' => 0,
            'total' => 999_999_999,
            'shipping_name' => 'X', 'shipping_phone' => '08', 'shipping_address' => 'X',
        ]);

        $this->assertEquals(5_000_000, app(TierService::class)->userSpending($user));
    }

    public function test_tier_discount_applied_in_checkout(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 6_000_000); // → Tier 1 Member, 10% off

        $product = Product::factory()->create(['price' => 200_000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tier_name', 'Member')
            ->assertJsonPath('data.tier_discount', 20_000)  // 10% of 200k
            ->assertJsonPath('data.subtotal', 180_000);     // 200k - 20k discount
    }

    public function test_no_tier_discount_for_user_below_threshold(): void
    {
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 3_000_000); // < 5jt threshold

        $product = Product::factory()->create(['price' => 100_000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier' => 'jnt_reg',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tier_name', null)
            ->assertJsonPath('data.tier_discount', 0)
            ->assertJsonPath('data.subtotal', 100_000);
    }

    public function test_admin_can_modify_tier_thresholds(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/admin/settings', [
            'settings' => [
                ['key' => 'tier_1_min_spend', 'value' => '100000'],
                ['key' => 'tier_1_discount', 'value' => '5'],
            ],
        ]);

        $response->assertOk();

        // Refresh service (cache will be cleared by Setting::set)
        $svc = app(TierService::class);
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 100_000);

        $tier = $svc->userTier($user);
        $this->assertEquals('Member', $tier['name']);
        $this->assertEquals(5, $tier['discount']);
    }
}
