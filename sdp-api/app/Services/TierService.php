<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\User;

class TierService
{
    /**
     * Load semua 5 tier config dari settings.
     * Return sorted desc by min_spend (tertinggi duluan).
     */
    public function tiers(): array
    {
        $tiers = [];
        for ($i = 1; $i <= 5; $i++) {
            $tiers[] = [
                'level'     => $i,
                'name'      => (string) Setting::get("tier_{$i}_name", "Tier {$i}"),
                'min_spend' => (float)  Setting::get("tier_{$i}_min_spend", 0),
                'discount'  => (float)  Setting::get("tier_{$i}_discount", 0),
            ];
        }
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
     * Hitung tier efektif user dengan dua aturan tambahan:
     * 1. Minimum tier adalah Gold (level 3) untuk semua user, termasuk guest & user baru daftar.
     * 2. Jika pernah beli tapi tidak ada order completed dalam 30 hari terakhir,
     *    tier turun 1 level (minimum Member / level 1).
     */
    public function userTier(User $user): ?array
    {
        // Admin bisa force override tier user (skip kalkulasi spending & penalty inaktivitas di bawah).
        if ($user->tier_override !== null
            && ($user->tier_override_expires_at === null || $user->tier_override_expires_at->isFuture())) {
            return $this->tierByLevel((int) $user->tier_override);
        }

        $spending  = $this->userSpending($user);
        $tiers     = $this->tiers();              // desc
        $ascTiers  = array_reverse($tiers);       // asc: Member → VIP

        // Tier yang didapat berdasarkan spending
        $earnedLevel = 1;
        foreach ($tiers as $tier) {
            if ($spending >= $tier['min_spend']) {
                $earnedLevel = $tier['level'];
                break;
            }
        }

        // Semua user minimum Gold (level 3)
        $earnedLevel = max($earnedLevel, 3);

        // Penalty inaktivitas: pernah beli tapi > 30 hari tidak ada order completed
        $lastOrderDate = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->latest('created_at')
            ->value('created_at');

        $hasEverPurchased = $lastOrderDate !== null;
        if ($hasEverPurchased && $lastOrderDate < now()->subDays(30)) {
            $earnedLevel = max($earnedLevel - 1, 1);
        }

        foreach ($ascTiers as $tier) {
            if ($tier['level'] === $earnedLevel) {
                return $tier;
            }
        }

        return null;
    }

    /**
     * Tier berikutnya di atas tier efektif user, beserta sisa belanja yang dibutuhkan.
     */
    public function nextTier(User $user): ?array
    {
        // Progress "tier berikutnya" tidak relevan kalau tier sudah dikunci admin.
        if ($user->tier_override !== null
            && ($user->tier_override_expires_at === null || $user->tier_override_expires_at->isFuture())) {
            return null;
        }

        $spending     = $this->userSpending($user);
        $current      = $this->userTier($user);
        $currentLevel = $current ? $current['level'] : 0;

        $ascTiers = array_reverse($this->tiers());
        foreach ($ascTiers as $tier) {
            if ($tier['level'] > $currentLevel) {
                return array_merge($tier, [
                    'remaining' => max(0, $tier['min_spend'] - $spending),
                ]);
            }
        }
        return null;
    }

    /**
     * Tier tetap untuk guest (tanpa akun) — disamakan dengan tier minimum user terdaftar (Gold).
     */
    public function tierByLevel(int $level): ?array
    {
        foreach ($this->tiers() as $tier) {
            if ($tier['level'] === $level) {
                return $tier;
            }
        }
        return null;
    }

    /**
     * Tier efektif untuk konteks request (user login atau guest).
     * $user null = guest, pakai tier Gold (level 3) — sama dengan perlakuan applyDiscount().
     */
    public function resolveTierForUser(?User $user): ?array
    {
        return $user ? $this->userTier($user) : $this->tierByLevel(3);
    }

    /**
     * Apply tier discount ke subtotal. $user null = guest, pakai tier Gold (level 3).
     */
    public function applyDiscount(float $subtotal, ?User $user): array
    {
        $tier = $this->resolveTierForUser($user);
        if (! $tier || $tier['discount'] <= 0) {
            return [
                'subtotal_after' => $subtotal,
                'discount'       => 0.0,
                'tier'           => null,
            ];
        }

        $discount = round($subtotal * $tier['discount'] / 100, 2);

        $maxDiscount = (float) Setting::get('tier_max_discount_rupiah', 0);
        if ($maxDiscount > 0 && $discount > $maxDiscount) {
            $discount = $maxDiscount;
        }

        return [
            'subtotal_after' => $subtotal - $discount,
            'discount'       => $discount,
            'tier'           => $tier,
        ];
    }
}
