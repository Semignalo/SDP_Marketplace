<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@sdp.id'], [
            'name'     => 'Admin SDP',
            'email'    => 'admin@sdp.id',
            'password' => 'password',
            'role'     => 'admin',
        ]);

        User::updateOrCreate(['email' => 'reseller@sdp.id'], [
            'name'          => 'Reseller One',
            'email'         => 'reseller@sdp.id',
            'password'      => 'password',
            'role'          => 'reseller',
            'reseller_code' => 'RESELLER0001',
            'phone'         => '081300000001',
        ]);

        $techstore = Vendor::where('slug', 'techstore')->first();
        User::updateOrCreate(['email' => 'vendor@techstore.id'], [
            'name'      => 'TechStore Admin',
            'email'     => 'vendor@techstore.id',
            'password'  => 'password',
            'role'      => 'vendor_admin',
            'vendor_id' => $techstore->id,
        ]);

        $reseller = User::where('email', 'reseller@sdp.id')->first();
        User::updateOrCreate(['email' => 'customer1@sdp.id'], [
            'name'        => 'Customer One',
            'email'       => 'customer1@sdp.id',
            'password'    => 'password',
            'role'        => 'customer',
            'referrer_id' => $reseller->id,
        ]);

        User::updateOrCreate(['email' => 'customer2@sdp.id'], [
            'name'     => 'Customer Two',
            'email'    => 'customer2@sdp.id',
            'password' => 'password',
            'role'     => 'customer',
        ]);
    }
}
