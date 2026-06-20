<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ResellerCommission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderLifecycleCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_cancel_expired_orders_restores_stock_and_cancels_commission(): void
    {
        $customer = User::factory()->create();
        $referrer = User::factory()->create();
        $product = Product::factory()->create(['stock' => 5]);

        $order = Order::create([
            'user_id' => $customer->id,
            'reseller_id' => $referrer->id,
            'order_number' => 'SDP-EXP-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 100000,
            'shipping_cost' => 16000,
            'total' => 116000,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_courier' => 'JNT EZ',
        ]);
        $order->forceFill(['created_at' => now()->subHours(25)])->save();

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'vendor_id' => $product->vendor_id,
            'product_name' => $product->name,
            'price' => 50000,
            'quantity' => 2,
            'subtotal' => 100000,
        ]);

        $commission = ResellerCommission::create([
            'reseller_id' => $referrer->id,
            'order_id' => $order->id,
            'customer_id' => $customer->id,
            'order_total' => 100000,
            'rate' => 10,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $this->artisan('orders:cancel-expired')->assertSuccessful();

        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals(7, $product->fresh()->stock);
        $this->assertEquals('cancelled', $commission->fresh()->status);
    }

    public function test_cancel_expired_orders_ignores_recent_pending_orders(): void
    {
        $customer = User::factory()->create();
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'SDP-RECENT-' . uniqid(),
            'status' => 'pending_payment',
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_courier' => 'JNT EZ',
        ]);

        $this->artisan('orders:cancel-expired')->assertSuccessful();

        $this->assertEquals('pending_payment', $order->fresh()->status);
    }

    public function test_complete_shipped_orders_marks_completed_and_earns_commission(): void
    {
        $customer = User::factory()->create();
        $referrer = User::factory()->create();

        $order = Order::create([
            'user_id' => $customer->id,
            'reseller_id' => $referrer->id,
            'order_number' => 'SDP-SHIP-' . uniqid(),
            'status' => 'shipped',
            'subtotal' => 100000,
            'shipping_cost' => 16000,
            'total' => 116000,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_courier' => 'JNT EZ',
        ]);
        $order->forceFill(['updated_at' => now()->subDays(8)])->save();

        $commission = ResellerCommission::create([
            'reseller_id' => $referrer->id,
            'order_id' => $order->id,
            'customer_id' => $customer->id,
            'order_total' => 100000,
            'rate' => 10,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $this->artisan('orders:complete-shipped')->assertSuccessful();

        $this->assertEquals('completed', $order->fresh()->status);
        $this->assertEquals('earned', $commission->fresh()->status);
    }

    public function test_complete_shipped_orders_ignores_recently_shipped_orders(): void
    {
        $customer = User::factory()->create();
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'SDP-RECENTSHIP-' . uniqid(),
            'status' => 'shipped',
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'total' => 50000,
            'shipping_name' => 'X',
            'shipping_phone' => '08',
            'shipping_address' => 'X',
            'shipping_courier' => 'JNT EZ',
        ]);

        $this->artisan('orders:complete-shipped')->assertSuccessful();

        $this->assertEquals('shipped', $order->fresh()->status);
    }
}
