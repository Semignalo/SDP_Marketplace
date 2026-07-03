import { calcDiscount, cn } from '../../lib/utils'
import { useFormatPrice } from '../../hooks/useCurrency'

/**
 * `price` = harga setelah diskon promo produk (compare_at_price).
 * `memberPrice` = harga akhir setelah diskon tier juga diterapkan (lihat ProductResource::calculateMemberPrice).
 * Harga yang dicoret selalu harga acuan tertinggi (compare_at_price kalau ada promo, else price),
 * supaya persentase diskon yang ditampilkan mencerminkan total (promo + tier).
 */
export function PriceLabel({ price, oldPrice, memberPrice, tierName, size = 'md', className = '' }) {
  const formatPrice = useFormatPrice()
  const finalPrice = memberPrice != null ? Number(memberPrice) : Number(price)
  const referencePrice = oldPrice && Number(oldPrice) > Number(price) ? Number(oldPrice) : Number(price)
  const hasDiscount = referencePrice > finalPrice
  const discountPct = hasDiscount ? calcDiscount(finalPrice, referencePrice) : 0
  const showTierBadge = tierName && memberPrice != null && Number(memberPrice) < Number(price)

  const sizes = {
    sm: { price: 'text-sm', old: 'text-xs', discount: 'text-2xs' },
    md: { price: 'text-base', old: 'text-xs', discount: 'text-xs' },
    lg: { price: 'text-xl', old: 'text-sm', discount: 'text-xs' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={cn('flex items-baseline flex-wrap gap-x-2 gap-y-0', className)}>
      <span className={cn('font-bold tabular-nums', hasDiscount ? 'text-accent' : 'text-ink', s.price)}>
        {formatPrice(finalPrice)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn('text-ink-faint line-through tabular-nums', s.old)}>
            {formatPrice(referencePrice)}
          </span>
          <span className={cn('font-semibold bg-accent-soft text-accent-hover rounded-sm px-1', s.discount)}>
            -{discountPct}%
          </span>
        </>
      )}
      {showTierBadge && (
        <span className={cn('font-semibold bg-ink text-paper rounded-sm px-1', s.discount)}>
          Harga {tierName}
        </span>
      )}
    </div>
  )
}
