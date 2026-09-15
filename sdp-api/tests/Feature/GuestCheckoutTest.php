<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::set('reseller_commission_rate', '10');
        Setting::set('shipping_min_free', '150000');
        Setting::set('shipping_max_free', '20000');
    }

    public function test_guest_order_rejected_for_india_shipping_country(): void
    {
        $product = Product::factory()->create(['stock' => 10]);

        $response = $this->postJson('/api/guest/orders', [
            'guest_email' => 'test@example.com',
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_country' => 'India',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['shipping_country']);
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(10, $product->fresh()->stock);
    }
}
