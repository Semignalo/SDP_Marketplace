<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $verified = now()

        User::create([
            'name' => 'Admin SDP',
            'email' => 'admin@sdp.local',
            'password' => 'password',
            'role' => 'admin',
            'phone' => '+6281200000000',
            'email_verified_at' => $verified,
        ]);

        foreach (Vendor::all() as $vendor) {
            User::create([
                'name' => $vendor->name . ' Owner',
                'email' => $vendor->slug . '@vendor.sdp.local',
                'password' => 'password',
                'role' => 'vendor_admin',
                'vendor_id' => $vendor->id,
                'phone' => '+62813' . random_int(10000000, 99999999),
                'email_verified_at' => $verified,
            ]);
        }

        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => "Customer {$i}",
                'email' => "customer{$i}@sdp.local",
                'password' => 'password',
                'role' => 'customer',
                'phone' => '+62815' . random_int(10000000, 99999999),
                'reseller_code' => strtoupper(Str::random(8)),
                'email_verified_at' => $verified,
            ]);
        }
    }
}
