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
            'Wanita' => ['Atasan', 'Bawahan', 'Dress', 'Outerwear'],
            'Pria' => ['Kaos', 'Kemeja', 'Celana', 'Jaket'],
            'Beauty' => ['Skincare', 'Makeup', 'Body Care', 'Fragrance'],
            'Anak' => ['Baju Bayi', 'Mainan'],
            'Aksesoris' => ['Tas', 'Sepatu', 'Topi', 'Jam Tangan'],
            'Sport' => ['Pakaian Olahraga', 'Peralatan'],
            'Rumah' => ['Dekorasi', 'Dapur'],
            'Gadget' => ['Aksesoris HP', 'Audio'],
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
