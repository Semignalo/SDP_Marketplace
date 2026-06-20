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
            ['name' => 'Kanaya Beauty', 'desc' => 'Skincare lokal dengan bahan natural pilihan untuk semua jenis kulit.'],
            ['name' => 'Lumière Skin', 'desc' => 'Skincare premium fokus glow dan brightening dengan aktif berkualitas tinggi.'],
            ['name' => 'Pure Atelier', 'desc' => 'Body care & bath ritual — sabun, lotion, dan scrub dengan wangi yang menenangkan.'],
            ['name' => 'Verda Botanica', 'desc' => 'Perawatan berbasis botanikal & herbal untuk kulit dan rambut.'],
            ['name' => 'Mochi Care', 'desc' => 'Perawatan lembut untuk kulit sensitif dan seluruh keluarga.'],
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
