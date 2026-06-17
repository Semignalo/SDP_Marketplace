// Kalkulasi tier discount & shipping subsidi — harus selalu sinkron
// dengan logika backend (TierService::applyDiscount & subsidi ongkir di Checkout/GuestCheckoutController).

export function calcTierDiscount(subtotal, tier, maxDiscountRupiah = 0) {
  if (!tier || !tier.discount) return 0
  const raw = Math.round(subtotal * tier.discount / 100)
  return maxDiscountRupiah > 0 ? Math.min(raw, maxDiscountRupiah) : raw
}

export function calcShippingCost(courierCost, subtotalAfterTier, freeShippingMin, freeShippingMax) {
  const isFreeShipping = subtotalAfterTier >= freeShippingMin
  return isFreeShipping ? Math.max(0, courierCost - freeShippingMax) : courierCost
}
