<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrderListTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_order_exposes_shipping_name_and_guest_email(): void
    {
        $this->makeOrder([
            'user_id' => null,
            'guest_email' => 'guest@example.com',
            'shipping_name' => 'Ghaycel Gaila',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/orders');

        $response->assertOk()
            ->assertJsonPath('data.0.customer', null)
            ->assertJsonPath('data.0.shipping_name', 'Ghaycel Gaila')
            ->assertJsonPath('data.0.guest_email', 'guest@example.com');
    }

    public function test_registered_order_still_exposes_customer(): void
    {
        $customer = User::factory()->create(['name' => 'Stefan', 'email' => 'stefan@example.com']);
        $this->makeOrder(['user_id' => $customer->id, 'shipping_name' => 'Stefan S']);

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/orders');

        $response->assertOk()
            ->assertJsonPath('data.0.customer.name', 'Stefan')
            ->assertJsonPath('data.0.shipping_name', 'Stefan S');
    }

    private function makeOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'order_number' => 'SDP-T-' . uniqid(),
            'status' => 'awaiting_quote',
            'subtotal' => 100000,
            'shipping_cost' => 0,
            'total' => 100000,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
        ], $overrides));
    }
}
