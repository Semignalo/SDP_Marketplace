<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateLegacyData extends Command
{
    protected $signature = 'legacy:migrate';

    protected $description = 'Migrasi data dari database lama (koneksi "legacy" -> sdp_legacy) ke skema SDP baru';

    /** @var array<int,int> legacy category id => new category id */
    private array $categoryMap = [];

    /** @var array<int,int> legacy product id => new product id */
    private array $productMap = [];

    /** @var array<int,int> legacy user id => new user id */
    private array $userMap = [];

    public function handle(): int
    {
        $this->info('Mulai migrasi data legacy...');

        DB::connection('mysql')->transaction(function () {
            $vendor = $this->migrateVendor();
            $this->migrateCategories();
            $this->migrateProducts($vendor->id);
            $this->migrateUsers();
            $this->migrateAddresses();
            $this->migrateOrders();
        });

        $this->info('Migrasi selesai.');

        return self::SUCCESS;
    }

    private function migrateVendor(): Vendor
    {
        $vendor = Vendor::updateOrCreate(
            ['slug' => 'starinc'],
            ['name' => 'STARINC', 'status' => 'active']
        );

        $this->info("Vendor STARINC siap (id={$vendor->id}).");

        return $vendor;
    }

    private function migrateCategories(): void
    {
        $rows = DB::connection('legacy')->table('Categories')->orderBy('id')->get();

        foreach ($rows as $row) {
            $slug = $row->slug ?: Str::slug($row->title);

            $category = Category::updateOrCreate(
                ['slug' => $slug],
                ['name' => $row->title]
            );

            $this->categoryMap[$row->id] = $category->id;
        }

        $this->info(count($rows) . ' kategori dimigrasi.');
    }

    private function migrateProducts(int $vendorId): void
    {
        $rows = DB::connection('legacy')->table('Products')->orderBy('id')->get();

        foreach ($rows as $row) {
            $slug = $row->slug ?: Str::slug($row->title);
            $original = $slug;
            $i = 1;
            while (Product::where('slug', $slug)->where('vendor_id', '!=', $vendorId)->exists()) {
                $slug = $original . '-' . (++$i);
            }

            $normalPrice = (float) ($row->normal_price ?? 0);
            $discountPrice = (float) ($row->discount_price ?? 0);
            $price = $discountPrice > 0 ? $discountPrice : $normalPrice;
            $compareAt = $discountPrice > 0 ? $normalPrice : null;

            $sku = trim((string) $row->code) ?: null;
            if ($sku && Product::where('sku', $sku)->where('slug', '!=', $slug)->exists()) {
                $sku = $sku . '-LEGACY' . $row->id;
            }

            $categoryId = $this->categoryMap[$row->category_id] ?? null;

            $product = Product::updateOrCreate(
                ['slug' => $slug],
                [
                    'vendor_id' => $vendorId,
                    'category_id' => $categoryId,
                    'name' => $row->title,
                    'description' => $row->description,
                    'price' => $price,
                    'compare_at_price' => $compareAt,
                    'stock' => 0,
                    'weight_gram' => $row->weight ?: 300,
                    'sku' => $sku,
                    'status' => $row->is_active ? 'active' : 'archived',
                ]
            );

            $this->productMap[$row->id] = $product->id;
        }

        $this->info(count($rows) . ' produk dimigrasi (stok di-set 0, foto perlu upload manual).');
    }

    private function migrateUsers(): void
    {
        $rows = DB::connection('legacy')->table('Users')
            ->whereNotIn('role', ['admin', 'superadmin'])
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $user = User::updateOrCreate(
                ['email' => $row->email],
                [
                    'name' => $row->fullname ?: 'User',
                    'password' => Str::random(24),
                    'role' => 'customer',
                    'reseller_code' => $row->code,
                    'phone' => $row->phone_number,
                    'address' => $row->address,
                    'email_verified_at' => now(),
                ]
            );

            if (! $row->is_active) {
                $user->delete();
            } elseif ($user->trashed()) {
                $user->restore();
            }

            $this->userMap[$row->id] = $user->id;
        }

        // Pass 2: sambungkan jaringan referral (sponsor_id -> referrer_id) setelah semua user punya id baru.
        foreach ($rows as $row) {
            if ($row->sponsor_id && isset($this->userMap[$row->sponsor_id], $this->userMap[$row->id])) {
                User::where('id', $this->userMap[$row->id])
                    ->update(['referrer_id' => $this->userMap[$row->sponsor_id]]);
            }
        }

        $this->info(count($rows) . ' user dimigrasi (password sementara random, role admin/superadmin lama di-skip).');
    }

    private function migrateAddresses(): void
    {
        $rows = DB::connection('legacy')->table('User_Destinations as ud')
            ->leftJoin('indonesia_villages as v', 'ud.village_id', '=', 'v.id')
            ->leftJoin('indonesia_districts as d', 'v.district_id', '=', 'd.id')
            ->leftJoin('indonesia_cities as c', 'd.city_id', '=', 'c.id')
            ->select('ud.*', 'c.name as city_name')
            ->orderBy('ud.user_id')
            ->get();

        $seenUser = [];
        $count = 0;

        foreach ($rows as $row) {
            $newUserId = $this->userMap[$row->user_id] ?? null;
            if (! $newUserId) {
                continue;
            }

            Address::firstOrCreate(
                [
                    'user_id' => $newUserId,
                    'recipient_name' => $row->fullname,
                    'phone' => $row->phone_number,
                    'address' => $row->address,
                ],
                [
                    'label' => 'Rumah',
                    'city' => $row->city_name ?: 'Tidak diketahui',
                    'city_id' => null,
                    'postal_code' => $row->postal_code,
                    'is_default' => ! isset($seenUser[$newUserId]),
                ]
            );

            $seenUser[$newUserId] = true;
            $count++;
        }

        $this->info("{$count} alamat dimigrasi (city_id dikosongkan, perlu dicocokkan manual ke RajaOngkir kalau mau hitung ongkir).");
    }

    private function migrateOrders(): void
    {
        $statusMap = [
            'PENDING' => 'pending_payment',
            'SUCCESS' => 'processing',
            'SHIPPING' => 'shipped',
            'DONE' => 'completed',
            'CANCEL' => 'cancelled',
        ];

        $couriers = DB::connection('legacy')->table('Couriers')->pluck('name', 'id');
        $transactions = DB::connection('legacy')->table('Transactions')->orderBy('id')->get();

        $skipped = 0;
        $migrated = 0;

        foreach ($transactions as $t) {
            $newUserId = $this->userMap[$t->user_id] ?? null;
            if (! $newUserId) {
                $skipped++;
                continue;
            }

            $destination = DB::connection('legacy')->table('Transaction_Destinations')
                ->where('transaction_id', $t->id)
                ->first();

            $items = DB::connection('legacy')->table('Transaction_Details')
                ->where('transaction_id', $t->id)
                ->get();

            $subtotal = $items->sum(fn ($i) => $i->price * $i->quantity);

            $customer = User::find($newUserId);
            $resellerId = $customer?->referrer_id;
            $referralCode = $resellerId ? User::find($resellerId)?->reseller_code : null;

            $order = Order::updateOrCreate(
                ['order_number' => $t->invoice],
                [
                    'user_id' => $newUserId,
                    'reseller_id' => $resellerId,
                    'referral_code' => $referralCode,
                    'status' => $statusMap[$t->status] ?? 'pending_payment',
                    'subtotal' => $subtotal,
                    'shipping_cost' => $t->shipping_fee ?? 0,
                    'tier_discount' => $t->milestone_discount ?? 0,
                    'tier_name' => null,
                    'total' => $t->total,
                    'shipping_name' => $destination->fullname ?? '-',
                    'shipping_address' => $destination->address ?? '-',
                    'shipping_phone' => $destination->phone_number ?? '-',
                    'shipping_courier' => $couriers[$t->courier_id] ?? null,
                    'tracking_number' => $t->receipt,
                ]
            );

            DB::connection('mysql')->table('orders')->where('id', $order->id)->update([
                'created_at' => $t->createdAt,
                'updated_at' => $t->updatedAt,
            ]);

            OrderItem::where('order_id', $order->id)->delete();

            foreach ($items as $item) {
                $productId = $this->productMap[$item->product_id] ?? null;
                if (! $productId) {
                    continue;
                }

                $product = Product::find($productId);

                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $productId,
                    'vendor_id' => $product->vendor_id,
                    'product_name' => $product->name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->price * $item->quantity,
                ]);

                DB::connection('mysql')->table('order_items')->where('id', $orderItem->id)->update([
                    'created_at' => $t->createdAt,
                    'updated_at' => $t->updatedAt,
                ]);
            }

            $migrated++;
        }

        $this->info("{$migrated} order dimigrasi, {$skipped} order di-skip (user-nya admin/tidak dimigrasi). Data komisi reseller TIDAK dimigrasi (mulai bersih).");
    }
}
