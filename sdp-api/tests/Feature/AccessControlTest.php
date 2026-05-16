<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    /* ───── Vendor scope ───── */

    public function test_vendor_admin_only_sees_own_products(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        Product::factory()->count(3)->create(['vendor_id' => $vendorA->id]);
        Product::factory()->count(5)->create(['vendor_id' => $vendorB->id]);

        $admin = User::factory()->vendorAdmin($vendorA->id)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/vendor/products');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_vendor_admin_cannot_update_other_vendor_product(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $productB = Product::factory()->create(['vendor_id' => $vendorB->id]);

        $admin = User::factory()->vendorAdmin($vendorA->id)->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/vendor/products/{$productB->id}", [
            'name' => 'Hacked',
            'category_id' => $productB->category_id,
            'price' => 1,
            'stock' => 1,
            'status' => 'active',
        ]);

        $response->assertForbidden();
    }

    public function test_customer_cannot_access_vendor_routes(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/vendor/products')
            ->assertForbidden();
    }

    public function test_vendor_admin_only_sees_orders_with_their_items(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();

        $productA = Product::factory()->create(['vendor_id' => $vendorA->id]);
        $productB = Product::factory()->create(['vendor_id' => $vendorB->id]);

        $customer = User::factory()->create();

        // Order 1: only vendor A items
        $order1 = $this->makeOrder($customer);
        OrderItem::create([
            'order_id' => $order1->id, 'product_id' => $productA->id, 'vendor_id' => $vendorA->id,
            'product_name' => $productA->name, 'price' => 100, 'quantity' => 1, 'subtotal' => 100,
        ]);

        // Order 2: only vendor B items
        $order2 = $this->makeOrder($customer);
        OrderItem::create([
            'order_id' => $order2->id, 'product_id' => $productB->id, 'vendor_id' => $vendorB->id,
            'product_name' => $productB->name, 'price' => 100, 'quantity' => 1, 'subtotal' => 100,
        ]);

        $adminA = User::factory()->vendorAdmin($vendorA->id)->create();

        $response = $this->actingAs($adminA, 'sanctum')->getJson('/api/vendor/orders');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    /* ───── Admin scope ───── */

    public function test_admin_endpoints_block_non_admin(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $vendorAdmin = User::factory()->vendorAdmin(Vendor::factory()->create()->id)->create();

        foreach ([$customer, $vendorAdmin] as $user) {
            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/summary')
                ->assertForbidden();
        }
    }

    public function test_admin_can_access_summary(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['revenue', 'orders_count', 'users_count']]);
    }

    public function test_admin_can_update_order_status(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        $order = $this->makeOrder($customer);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->order_number}/status", [
                'status' => 'processing',
                'admin_notes' => 'Verified manual transfer',
            ]);

        $response->assertOk();
        $fresh = $order->fresh();
        $this->assertEquals('processing', $fresh->status);
        $this->assertNotNull($fresh->payment_verified_at);
        $this->assertEquals('Verified manual transfer', $fresh->admin_notes);
    }

    /* ───── Referral scope (semua user authenticated bisa akses) ───── */

    public function test_all_authenticated_users_can_access_reseller_summary(): void
    {
        $customer = User::factory()->create();
        $this->actingAs($customer, 'sanctum')->getJson('/api/reseller/summary')->assertOk();
    }

    public function test_unauthenticated_blocked_from_reseller_summary(): void
    {
        $this->getJson('/api/reseller/summary')->assertStatus(401);
    }

    /* ───── Helper ───── */

    private function makeOrder(User $customer): Order
    {
        return Order::create([
            'user_id' => $customer->id,
            'order_number' => 'SDP-T-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 100,
            'shipping_cost' => 0,
            'total' => 100,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
        ]);
    }
}
