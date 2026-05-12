<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $techstore  = Vendor::where('slug', 'techstore')->first();
        $fashionhub = Vendor::where('slug', 'fashionhub')->first();

        $electronics = Category::where('slug', 'electronics')->first();
        $fashion     = Category::where('slug', 'fashion')->first();
        $beauty      = Category::where('slug', 'beauty')->first();

        $products = [
            [
                'vendor_id'      => $techstore->id,
                'category_id'    => $electronics->id,
                'name'           => 'Wireless Earbuds Pro',
                'slug'           => 'wireless-earbuds-pro',
                'description'    => 'True wireless earbuds with active noise cancellation.',
                'price'          => 599000,
                'price_reseller' => 549000,
                'stock'          => 50,
                'sku'            => 'TS-EAR-001',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $techstore->id,
                'category_id'    => $electronics->id,
                'name'           => 'Smartwatch Series 5',
                'slug'           => 'smartwatch-series-5',
                'description'    => 'Health monitoring smartwatch with GPS.',
                'price'          => 1299000,
                'price_reseller' => 1199000,
                'stock'          => 30,
                'sku'            => 'TS-WATCH-005',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $techstore->id,
                'category_id'    => $electronics->id,
                'name'           => 'USB-C Hub 7-in-1',
                'slug'           => 'usb-c-hub-7in1',
                'description'    => 'Expand your laptop connectivity with 7 ports.',
                'price'          => 349000,
                'price_reseller' => 319000,
                'stock'          => 100,
                'sku'            => 'TS-HUB-007',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $techstore->id,
                'category_id'    => $electronics->id,
                'name'           => 'Mechanical Keyboard TKL',
                'slug'           => 'mechanical-keyboard-tkl',
                'description'    => 'Tenkeyless mechanical keyboard with blue switches.',
                'price'          => 799000,
                'price_reseller' => 749000,
                'stock'          => 25,
                'sku'            => 'TS-KB-TKL',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $fashionhub->id,
                'category_id'    => $fashion->id,
                'name'           => 'Classic White Sneakers',
                'slug'           => 'classic-white-sneakers',
                'description'    => 'Clean minimal sneakers for everyday wear.',
                'price'          => 449000,
                'price_reseller' => 409000,
                'stock'          => 80,
                'sku'            => 'FH-SHOE-CWS',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $fashionhub->id,
                'category_id'    => $fashion->id,
                'name'           => 'Oversized Linen Shirt',
                'slug'           => 'oversized-linen-shirt',
                'description'    => 'Breathable linen shirt, perfect for tropical weather.',
                'price'          => 279000,
                'price_reseller' => 249000,
                'stock'          => 60,
                'sku'            => 'FH-SHIRT-OLS',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $fashionhub->id,
                'category_id'    => $beauty->id,
                'name'           => 'Hydrating Face Serum',
                'slug'           => 'hydrating-face-serum',
                'description'    => 'Lightweight vitamin C serum for glowing skin.',
                'price'          => 199000,
                'price_reseller' => 179000,
                'stock'          => 120,
                'sku'            => 'FH-SERUM-HFS',
                'status'         => 'active',
            ],
            [
                'vendor_id'      => $fashionhub->id,
                'category_id'    => $fashion->id,
                'name'           => 'Canvas Tote Bag',
                'slug'           => 'canvas-tote-bag',
                'description'    => 'Durable canvas tote, eco-friendly and stylish.',
                'price'          => 149000,
                'price_reseller' => 129000,
                'stock'          => 150,
                'sku'            => 'FH-BAG-CTB',
                'status'         => 'active',
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['slug' => $product['slug']], $product);
        }
    }
}
