<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\User;

class TierService
{
    /**
     * Load semua 5 tier config dari settings.
     * Return: [{ level, name, min_spend, discount }, ...] sorted desc by min_spend (highest first).
     */
    public function tiers(): array
    {
        $tiers = [];
        for ($i = 1; $i <= 5; $i++) {
            $tiers[] = [
                'level' => $i,
                'name' => (string) Setting::get("tier_{$i}_name", "Tier {$i}"),
                'min_spend' => (float) Setting::get("tier_{$i}_min_spend", 0),
                'discount' => (float) Setting::get("tier_{$i}_discount", 0),
            ];
        }

        // Sort desc by min_spend (untuk userTier lookup yang cek tier tertinggi dulu)
        usort($tiers, fn ($a, $b) => $b['min_spend'] <=> $a['min_spend']);
        return $tiers;
    }

    public function userSpending(User $user): float
    {
        return (float) Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->sum('subtotal');
    }

    /**
     * Return tier object yang min_spend <= userSpending, atau null kalau di bawah Tier 1.
     */
    public function userTier(User $user): ?array
    {
        $spending = $this->userSpending($user);
        foreach ($this->tiers() as $tier) {
            if ($spending >= $tier['min_spend']) {
                return $tier;
            }
        }
        return null;
    }

    /**
     * Return tier berikutnya (untuk progress display) + remaining amount.
     * Null kalau user sudah di tier tertinggi.
     */
    public function nextTier(User $user): ?array
    {
        $spending = $this->userSpending($user);
        // tiers() sorted desc, reverse jadi asc untuk cari first that is above current spending
        $ascTiers = array_reverse($this->tiers());
        foreach ($ascTiers as $tier) {
            if ($spending < $tier['min_spend']) {
                return array_merge($tier, [
                    'remaining' => max(0, $tier['min_spend'] - $spending),
                ]);
            }
        }
        return null;
    }

    /**
     * Apply tier discount ke subtotal.
     * Return: ['subtotal_after' => float, 'discount' => float, 'tier' => array|null]
     */
    public function applyDiscount(float $subtotal, User $user): array
    {
        $tier = $this->userTier($user);
        if (! $tier || $tier['discount'] <= 0) {
            return [
                'subtotal_after' => $subtotal,
                'discount' => 0.0,
                'tier' => null,
            ];
        }

        $discount = round($subtotal * $tier['discount'] / 100, 2);
        return [
            'subtotal_after' => $subtotal - $discount,
            'discount' => $discount,
            'tier' => $tier,
        ];
    }
}
