import { formatRupiah, calcDiscount } from '../../lib/utils'
import { cn } from '../../lib/utils'

export function PriceLabel({ price, oldPrice, size = 'md', className = '' }) {
  const hasDiscount = oldPrice && Number(oldPrice) > Number(price)
  const discountPct = hasDiscount ? calcDiscount(price, oldPrice) : 0

  const sizes = {
    sm: { price: 'text-sm', old: 'text-xs', discount: 'text-2xs' },
    md: { price: 'text-base', old: 'text-xs', discount: 'text-xs' },
    lg: { price: 'text-xl', old: 'text-sm', discount: 'text-xs' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={cn('flex items-baseline flex-wrap gap-x-2 gap-y-0', className)}>
      <span className={cn('font-bold tabular-nums', hasDiscount ? 'text-accent' : 'text-ink', s.price)}>
        {formatRupiah(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn('text-ink-faint line-through tabular-nums', s.old)}>
            {formatRupiah(oldPrice)}
          </span>
          <span className={cn('font-semibold bg-accent-soft text-accent-hover rounded-sm px-1', s.discount)}>
            -{discountPct}%
          </span>
        </>
      )}
    </div>
  )
}
