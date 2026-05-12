<?php

namespace Database\Seeders;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        Vendor::updateOrCreate(['slug' => 'techstore'], [
            'name'            => 'TechStore',
            'slug'            => 'techstore',
            'description'     => 'Your one-stop shop for electronics and gadgets.',
            'email'           => 'hello@techstore.id',
            'phone'           => '081200000001',
            'commission_rate' => null,
            'status'          => 'active',
        ]);

        Vendor::updateOrCreate(['slug' => 'fashionhub'], [
            'name'            => 'FashionHub',
            'slug'            => 'fashionhub',
            'description'     => 'Trendy fashion for everyone.',
            'email'           => 'hello@fashionhub.id',
            'phone'           => '081200000002',
            'commission_rate' => null,
            'status'          => 'active',
        ]);
    }
}
