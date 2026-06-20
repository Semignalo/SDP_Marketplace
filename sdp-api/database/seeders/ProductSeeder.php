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
    // Curated Unsplash *product* photos (botol/jar/tube/flatlay) — fokus foto produk
    // skincare & body care, bukan foto model. Setiap ID sudah diverifikasi visual.
    // Swap dengan foto produk asli sebelum production launch.
    private const IMG = [
        'skincare_flatlay'  => 'photo-1612817288484-6f916006741a',
        'cleanser_bottle'   => 'photo-1556228578-8c89e6adf883',
        'facewash_tube'     => 'photo-1556228720-195a672e8a03',
        'moist_tube'        => 'photo-1620916566398-39f1143ab7be',
        'serum_dark'        => 'photo-1608248543803-ba4f8c70ae0b',
        'bodycare_flat'     => 'photo-1598440947619-2c35fc9aa908',
        'serum_botanical'   => 'photo-1611930022073-b7a4ba5fcccd',
        'cream_jar'         => 'photo-1601049541289-9b1b7bbbfe19',
        'skincare_tubes'    => 'photo-1571781926291-c477ebfd024b',
        'perfume_dark'      => 'photo-1541643600914-78b084683601',
        'lip_balm'          => 'photo-1598452963314-b09f397a5c48',
        'facial_oil'        => 'photo-1617897903246-719242758050',
        'skincare_lineup'   => 'photo-1629198688000-71f23e745b6e',
        'amber_oil'         => 'photo-1532413992378-f169ac26fff0',
        'black_jar_set'     => 'photo-1567721913486-6585f069b332',
        'perfume_lilac'     => 'photo-1556228453-efd6c1ff04f6',
        'amber_perfume'     => 'photo-1608571423902-eed4a5ad8108',
        'spray_can'         => 'photo-1610705267928-1b9f2fa7f1c5',
        'gua_sha'           => 'photo-1592136957897-b2b6ca21e10d',
        'green_bottle'      => 'photo-1535585209827-a15fcdbc4c2d',
        'soap_bars'         => 'photo-1600857544200-b2f666a9a2ec',
        'green_set'         => 'photo-1608248597279-f99d160bfcbc',
        'pink_cosmetics'    => 'photo-1583209814683-c023dd293cc6',
        'white_tubes'       => 'photo-1631729371254-42c2892f0e6e',
        'silver_bottles'    => 'photo-1602928298849-325cec8771c0',
        'dropper_serum'     => 'photo-1607602132700-068258431c6c',
    ];

    private const FALLBACK_IMAGE = 'photo-1612817288484-6f916006741a';

    private function imageUrl(string $key): string
    {
        $photoId = self::IMG[$key] ?? self::FALLBACK_IMAGE;
        return "https://images.unsplash.com/{$photoId}?w=600&h=800&q=80&fit=crop";
    }

    public function run(): void
    {
        // [childCategory, parentCategory, name, price, [imageKeys...]]
        $catalog = [
            'kanaya-beauty' => [
                ['Cleanser', 'Skincare', 'Gentle Gel Cleanser Centella 100ml', 95000, ['facewash_tube', 'cleanser_bottle', 'skincare_flatlay']],
                ['Serum', 'Skincare', 'Vitamin C Brightening Serum 30ml', 189000, ['serum_botanical', 'dropper_serum', 'skincare_lineup']],
                ['Moisturizer', 'Skincare', 'Daily Glow Moisturizer SPF 30', 165000, ['moist_tube', 'cream_jar', 'skincare_flatlay']],
                ['Sunscreen', 'Skincare', 'Hydra Protect Sunscreen SPF 50 PA++++', 145000, ['white_tubes', 'skincare_lineup', 'skincare_tubes']],
                ['Masker', 'Skincare', 'Clay Detox Mask Green Tea', 125000, ['black_jar_set', 'green_set', 'cream_jar']],
                ['Toner', 'Skincare', 'Hydrating Toner Rice Water 150ml', 89000, ['skincare_tubes', 'green_bottle', 'skincare_lineup']],
            ],
            'lumiere-skin' => [
                ['Serum', 'Skincare', 'Niacinamide 10% Glow Serum', 245000, ['serum_dark', 'dropper_serum', 'skincare_lineup']],
                ['Serum', 'Skincare', 'Retinol Renewal Night Serum', 320000, ['amber_oil', 'serum_botanical', 'serum_dark']],
                ['Eye Care', 'Lip & Eye', 'Brightening Eye Cream Caffeine 15ml', 215000, ['cream_jar', 'skincare_lineup', 'skincare_flatlay']],
                ['Moisturizer', 'Skincare', 'Luxe Hydra Cream Hyaluronic', 285000, ['skincare_flatlay', 'moist_tube', 'cream_jar']],
                ['Masker', 'Skincare', 'Overnight Glow Sleeping Mask', 175000, ['black_jar_set', 'green_set', 'skincare_tubes']],
                ['Toner', 'Skincare', 'Radiance Essence Toner 120ml', 198000, ['skincare_tubes', 'green_bottle', 'skincare_lineup']],
            ],
            'pure-atelier' => [
                ['Body Wash', 'Body Care', 'Nourishing Body Wash Shea Butter', 110000, ['bodycare_flat', 'soap_bars', 'skincare_lineup']],
                ['Body Lotion', 'Body Care', 'Silk Body Lotion Vanilla Cashmere', 125000, ['skincare_lineup', 'white_tubes', 'cream_jar']],
                ['Body Scrub', 'Body Care', 'Coffee Body Scrub Energizing', 98000, ['black_jar_set', 'amber_oil', 'bodycare_flat']],
                ['Hand Cream', 'Body Care', 'Repair Hand Cream Almond 75ml', 75000, ['white_tubes', 'cream_jar', 'skincare_lineup']],
                ['Body Wash', 'Body Care', 'Artisan Soap Bar Lavender', 65000, ['soap_bars', 'bodycare_flat', 'black_jar_set']],
                ['Body Lotion', 'Body Care', 'Body Butter Cocoa Rich 200ml', 135000, ['cream_jar', 'skincare_flatlay', 'white_tubes']],
            ],
            'verda-botanica' => [
                ['Serum', 'Skincare', 'Botanical Face Oil Rosehip 30ml', 175000, ['facial_oil', 'amber_oil', 'dropper_serum']],
                ['Hair Oil', 'Hair Care', 'Argan Hair Oil Repair 60ml', 145000, ['amber_perfume', 'silver_bottles', 'amber_oil']],
                ['Toner', 'Skincare', 'Herbal Balancing Toner Tea Tree', 95000, ['green_bottle', 'green_set', 'skincare_tubes']],
                ['Shampoo', 'Hair Care', 'Botanical Strength Shampoo 250ml', 120000, ['silver_bottles', 'spray_can', 'green_set']],
                ['Masker', 'Skincare', 'Herbal Clay Mask Charcoal', 115000, ['black_jar_set', 'green_set', 'cream_jar']],
                ['Serum', 'Skincare', 'Centella Calming Serum 30ml', 165000, ['serum_botanical', 'dropper_serum', 'serum_dark']],
            ],
            'mochi-care' => [
                ['Cleanser', 'Skincare', 'Gentle Foaming Cleanser Sensitive', 85000, ['cleanser_bottle', 'facewash_tube', 'skincare_flatlay']],
                ['Lip Care', 'Lip & Eye', 'Tinted Lip Balm Strawberry', 55000, ['lip_balm', 'pink_cosmetics', 'skincare_lineup']],
                ['Body Mist', 'Fragrance', 'Soft Body Mist Cotton Breeze 100ml', 95000, ['spray_can', 'perfume_lilac', 'silver_bottles']],
                ['Hand Cream', 'Body Care', 'Mini Hand Cream Set Travel', 89000, ['white_tubes', 'skincare_lineup', 'cream_jar']],
                ['Parfum', 'Fragrance', 'Eau de Parfum Garden Bloom 50ml', 275000, ['perfume_dark', 'perfume_lilac', 'amber_perfume']],
                ['Eye Care', 'Lip & Eye', 'Facial Gua Sha & Roller Set', 135000, ['gua_sha', 'skincare_flatlay', 'green_set']],
            ],
        ];

        foreach ($catalog as $vendorSlug => $items) {
            $vendor = Vendor::where('slug', $vendorSlug)->first();
            if (!$vendor) {
                continue;
            }

            foreach ($items as [$childCatName, $parentCatName, $productName, $price, $imageKeys]) {
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
                    'description' => "{$productName} dari {$vendor->name}. Diformulasikan dengan bahan pilihan untuk hasil yang lembut di kulit dan aman dipakai setiap hari. Tekstur ringan, mudah menyerap, tanpa rasa lengket.",
                    'price' => $finalPrice,
                    'compare_at_price' => $hasDiscount ? $price : null,
                    'stock' => random_int(10, 100),
                    'sku' => strtoupper($vendor->slug[0] . substr(Str::random(8), 0, 7)),
                    'status' => 'active',
                ]);

                foreach ($imageKeys as $i => $key) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'url' => $this->imageUrl($key),
                        'sort_order' => $i,
                    ]);
                }
            }
        }
    }
}
