<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'lumiere-studio' => [
                ['Atasan', 'Blouse Linen Crinkle', 245000, 'Wanita'],
                ['Atasan', 'Tank Top Knit Premium', 189000, 'Wanita'],
                ['Bawahan', 'Celana Kulot Pleated', 320000, 'Wanita'],
                ['Bawahan', 'Rok Midi A-Line', 275000, 'Wanita'],
                ['Dress', 'Long Dress Floral Summer', 425000, 'Wanita'],
                ['Dress', 'Mini Dress Linen Classic', 365000, 'Wanita'],
                ['Outerwear', 'Blazer Oversized Wool', 685000, 'Wanita'],
                ['Outerwear', 'Cardigan Knit Boxy', 395000, 'Wanita'],
            ],
            'kanaya-beauty' => [
                ['Skincare', 'Serum Vitamin C Brightening 30ml', 189000, 'Beauty'],
                ['Skincare', 'Moisturizer Daily Glow SPF 30', 312000, 'Beauty'],
                ['Skincare', 'Cleansing Oil Gentle Pure', 145000, 'Beauty'],
                ['Skincare', 'Sunscreen Hydra Protect 50ml', 165000, 'Beauty'],
                ['Makeup', 'Lip Tint Matte Velvet', 89000, 'Beauty'],
                ['Makeup', 'Cushion Foundation Dewy Skin', 245000, 'Beauty'],
                ['Body Care', 'Body Lotion Vanilla Cashmere', 125000, 'Beauty'],
                ['Fragrance', 'EDP Garden Bloom 50ml', 485000, 'Beauty'],
            ],
            'aksen-pria' => [
                ['Kaos', 'Kaos Polos Cotton Combed Heavy', 119000, 'Pria'],
                ['Kaos', 'Kaos Oversize Graphic Print', 145000, 'Pria'],
                ['Kemeja', 'Kemeja Linen Short Sleeve', 285000, 'Pria'],
                ['Kemeja', 'Kemeja Oxford Slim Fit', 325000, 'Pria'],
                ['Celana', 'Celana Chino Tapered', 365000, 'Pria'],
                ['Celana', 'Celana Cargo Relaxed', 395000, 'Pria'],
                ['Jaket', 'Jaket Bomber Premium', 545000, 'Pria'],
                ['Jaket', 'Jaket Denim Trucker Classic', 485000, 'Pria'],
            ],
            'mini-mochi' => [
                ['Baju Bayi', 'Set Bodysuit Cotton Organik 0-12m', 165000, 'Anak'],
                ['Baju Bayi', 'Piyama Anak Soft Bamboo', 145000, 'Anak'],
                ['Mainan', 'Teether Silicone Food Grade', 89000, 'Anak'],
                ['Mainan', 'Mainan Edukasi Stacking Blocks', 185000, 'Anak'],
            ],
            'atelier-goods' => [
                ['Tas', 'Tote Bag Canvas Premium Large', 175000, 'Aksesoris'],
                ['Tas', 'Sling Bag Leather Minimal', 425000, 'Aksesoris'],
                ['Tas', 'Backpack Daily Roll-Top', 545000, 'Aksesoris'],
                ['Sepatu', 'Sneakers Casual Everyday White', 520000, 'Aksesoris'],
                ['Sepatu', 'Loafer Suede Soft Brown', 685000, 'Aksesoris'],
                ['Topi', 'Bucket Hat Canvas Natural', 145000, 'Aksesoris'],
                ['Jam Tangan', 'Watch Minimal Mesh Silver', 425000, 'Aksesoris'],
            ],
        ];

        foreach ($catalog as $vendorSlug => $items) {
            $vendor = Vendor::where('slug', $vendorSlug)->first();
            if (!$vendor) {
                continue;
            }

            foreach ($items as [$childCatName, $productName, $price, $parentCatName]) {
                $category = Category::where('name', $childCatName)
                    ->whereHas('parent', fn ($q) => $q->where('name', $parentCatName))
                    ->first();

                $slug = Str::slug($productName) . '-' . Str::lower(Str::random(4));
                $hasDiscount = random_int(0, 3) === 0;
                $finalPrice = $hasDiscount ? (int) round($price * 0.75) : $price;

                $product = Product::create([
                    'vendor_id' => $vendor->id,
                    'category_id' => $category?->id,
                    'name' => $productName,
                    'slug' => $slug,
                    'description' => "Produk berkualitas dari {$vendor->name}. {$productName} dirancang dengan material premium dan detail finishing yang rapi. Cocok untuk pemakaian sehari-hari.",
                    'price' => $finalPrice,
                    'stock' => random_int(10, 100),
                    'sku' => strtoupper($vendor->slug[0] . substr(Str::random(8), 0, 7)),
                    'status' => 'active',
                ]);

                $seed = $product->id * 10;
                for ($i = 1; $i <= 3; $i++) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'url' => "https://picsum.photos/seed/sdp{$seed}{$i}/600/800",
                        'sort_order' => $i - 1,
                    ]);
                }
            }
        }
    }
}
