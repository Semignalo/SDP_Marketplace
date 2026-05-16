<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBrowseTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_index_returns_paginated_list(): void
    {
        Product::factory()->count(25)->create();

        $response = $this->getJson('/api/products?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 25);
    }

    public function test_products_index_filters_by_category(): void
    {
        $cat1 = Category::factory()->create(['slug' => 'beauty']);
        $cat2 = Category::factory()->create(['slug' => 'fashion']);
        Product::factory()->count(3)->create(['category_id' => $cat1->id]);
        Product::factory()->count(5)->create(['category_id' => $cat2->id]);

        $response = $this->getJson('/api/products?category=beauty');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_products_index_filters_by_vendor(): void
    {
        $vendor = Vendor::factory()->create(['slug' => 'my-vendor']);
        Product::factory()->count(4)->create(['vendor_id' => $vendor->id]);
        Product::factory()->count(2)->create(); // other vendors

        $response = $this->getJson('/api/products?vendor=my-vendor');

        $response->assertOk()->assertJsonCount(4, 'data');
    }

    public function test_products_index_search(): void
    {
        Product::factory()->create(['name' => 'Premium Serum Wajah']);
        Product::factory()->create(['name' => 'Tas Kulit Mewah']);

        $response = $this->getJson('/api/products?search=serum');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Premium Serum Wajah');
    }

    public function test_product_show_by_slug_returns_detail_with_related(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['slug' => 'target-product', 'category_id' => $category->id]);
        Product::factory()->count(3)->create(['category_id' => $category->id]); // related

        $response = $this->getJson('/api/products/target-product');

        $response->assertOk()
            ->assertJsonPath('data.slug', 'target-product')
            ->assertJsonStructure(['data' => ['id', 'name', 'price'], 'related']);
    }

    public function test_product_show_returns_404_for_missing_slug(): void
    {
        $this->getJson('/api/products/nonexistent')->assertNotFound();
    }

    public function test_inactive_products_hidden_from_public_list(): void
    {
        Product::factory()->count(2)->create(['status' => 'active']);
        Product::factory()->count(3)->create(['status' => 'draft']);

        $response = $this->getJson('/api/products');

        $response->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_categories_index_returns_tree(): void
    {
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);
        Category::factory()->create(['parent_id' => $parent->id]);

        $response = $this->getJson('/api/categories');

        $response->assertOk();
    }
}
