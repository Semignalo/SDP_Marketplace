<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Skincare' => ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen', 'Masker'],
            'Body Care' => ['Body Wash', 'Body Lotion', 'Body Scrub', 'Hand Cream'],
            'Hair Care' => ['Shampoo', 'Hair Oil'],
            'Lip & Eye' => ['Lip Care', 'Eye Care'],
            'Fragrance' => ['Parfum', 'Body Mist'],
        ];

        $order = 0;
        foreach ($tree as $parentName => $children) {
            $parent = Category::create([
                'name' => $parentName,
                'slug' => Str::slug($parentName),
                'sort_order' => $order++,
            ]);

            $childOrder = 0;
            foreach ($children as $childName) {
                Category::create([
                    'name' => $childName,
                    'slug' => Str::slug($parentName . '-' . $childName),
                    'parent_id' => $parent->id,
                    'sort_order' => $childOrder++,
                ]);
            }
        }
    }
}
