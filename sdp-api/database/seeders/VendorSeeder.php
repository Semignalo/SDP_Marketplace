<?php

namespace Database\Seeders;

use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            ['name' => 'Lumière Studio', 'desc' => 'Brand fashion wanita kontemporer dengan estetika minimalis.'],
            ['name' => 'Kanaya Beauty', 'desc' => 'Skincare lokal dengan bahan natural pilihan untuk semua jenis kulit.'],
            ['name' => 'Aksen Pria', 'desc' => 'Pakaian dan aksesoris pria untuk gaya kasual dan formal.'],
            ['name' => 'Mini Mochi', 'desc' => 'Perlengkapan anak yang lucu, nyaman, dan aman.'],
            ['name' => 'Atelier Goods', 'desc' => 'Tas dan aksesoris kulit hasil kerajinan tangan.'],
        ];

        foreach ($vendors as $v) {
            Vendor::create([
                'name' => $v['name'],
                'slug' => Str::slug($v['name']),
                'description' => $v['desc'],
                'email' => Str::slug($v['name']) . '@vendor.sdp.local',
                'phone' => '+62812' . random_int(10000000, 99999999),
                'status' => 'active',
            ]);
        }
    }
}
