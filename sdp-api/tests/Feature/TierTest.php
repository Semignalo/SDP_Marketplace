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

    public function test_user_with_no_completed_orders_gets_minimum_gold(): void
    {
        // Semua user (termasuk guest & user baru daftar) mendapat minimum Gold (level 3) meski belum pernah beli.
        $user = User::factory()->create();
        $svc = app(TierService::class);

        $this->assertEquals(0, $svc->userSpending($user));
        $tier = $svc->userTier($user);
        $this->assertNotNull($tier);
        $this->assertEquals(3, $tier['level']);
        $this->assertEquals('Gold', $tier['name']);
        $this->assertEquals('Platinum', $svc->nextTier($user)['name']);
    }

    public function test_user_below_gold_threshold_still_bumped_to_gold_minimum(): void
    {
        // Earning level 1 (Member) dari spending 5.5jt → dibumped ke minimum Gold (level 3).
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 5_500_000);

        $tier = app(TierService::class)->userTier($user);
        $this->assertEquals('Gold', $tier['name']);
        $this->assertEquals(20, $tier['discount']);
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
        // User 6jt spending → earned level 1 → bumped ke minimum Gold (level 3) → 20% discount
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 6_000_000);

        $product = Product::factory()->create(['price' => 200_000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tier_name', 'Gold')
            ->assertJsonPath('data.tier_discount', 40000)  // 20% of 200k
            ->assertJsonPath('data.subtotal', 160000);     // 200k - 40k discount
    }

    public function test_all_users_get_gold_discount_as_minimum(): void
    {
        // Semua user minimum Gold — bahkan yang spending 0 atau di bawah threshold.
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 3_000_000); // < 5jt threshold

        $product = Product::factory()->create(['price' => 100_000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tier_name', 'Gold')
            ->assertJsonPath('data.tier_discount', 20000)  // 20% of 100k
            ->assertJsonPath('data.subtotal', 80000);
    }

    public function test_tier_discount_is_capped_by_max_rupiah_setting(): void
    {
        Setting::set('tier_max_discount_rupiah', '50000');

        // VIP 30% × 1jt = 300k, harus dipotong jadi cap 50k
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 30_000_000);

        $product = Product::factory()->create(['price' => 1_000_000, 'stock' => 10]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'courier_name' => 'JNT EZ',
            'shipping_cost' => 16000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tier_name', 'VIP')
            ->assertJsonPath('data.tier_discount', 50000)
            ->assertJsonPath('data.subtotal', 950000);
    }

    public function test_tier_discount_uncapped_when_max_setting_is_zero(): void
    {
        Setting::set('tier_max_discount_rupiah', '0');

        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 30_000_000);

        $discount = app(TierService::class)->applyDiscount(1_000_000, $user);
        $this->assertEquals(300000, $discount['discount']);
    }

    public function test_admin_can_modify_tier_thresholds(): void
    {
        // Modifikasi tier di ATAS floor (Platinum) — user dengan spending yang cukup harus dapat rate baru.
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/admin/settings', [
            'settings' => [
                ['key' => 'tier_4_min_spend', 'value' => '16000000'],
                ['key' => 'tier_4_discount', 'value' => '5'],
                ['key' => 'tier_4_name', 'value' => 'PlatinumMod'],
            ],
        ]);

        $response->assertOk();

        $svc = app(TierService::class);
        $user = User::factory()->create();
        $this->makeCompletedOrder($user, 16_200_000);

        $tier = $svc->userTier($user);
        $this->assertEquals('PlatinumMod', $tier['name']);
        $this->assertEquals(5, $tier['discount']);
    }

    public function test_admin_can_modify_the_gold_floor_tier_itself(): void
    {
        // Karena Gold adalah floor minimum, modifikasi tier_3 langsung mempengaruhi user tanpa spending.
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/admin/settings', [
            'settings' => [
                ['key' => 'tier_3_discount', 'value' => '12'],
                ['key' => 'tier_3_name', 'value' => 'GoldMod'],
            ],
        ]);

        $response->assertOk();

        $svc = app(TierService::class);
        $user = User::factory()->create();

        $tier = $svc->userTier($user);
        $this->assertEquals('GoldMod', $tier['name']);
        $this->assertEquals(12, $tier['discount']);
    }
}
