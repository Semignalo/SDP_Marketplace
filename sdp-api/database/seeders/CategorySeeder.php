<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Electronics', 'slug' => 'electronics', 'sort_order' => 1],
            ['name' => 'Fashion',     'slug' => 'fashion',     'sort_order' => 2],
            ['name' => 'Beauty',      'slug' => 'beauty',      'sort_order' => 3],
            ['name' => 'Home',        'slug' => 'home',        'sort_order' => 4],
            ['name' => 'Sports',      'slug' => 'sports',      'sort_order' => 5],
            ['name' => 'Food',        'slug' => 'food',        'sort_order' => 6],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
