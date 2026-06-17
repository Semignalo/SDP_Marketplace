import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIZES = {
  sm: { icon: 11, text: 'text-2xs' },
  md: { icon: 14, text: 'text-xs' },
}

export function StarRating({ value, count, label, size = 'sm', className = '' }) {
  if (!value) return null
  const s = SIZES[size] || SIZES.sm

  return (
    <div className={cn('inline-flex items-center gap-1', s.text, className)}>
      <Star size={s.icon} className="fill-rating text-rating" />
      <span className="font-semibold text-ink-soft">{value}</span>
      {count > 0 && <span className="text-ink-muted">({count}{label ? ` ${label}` : ''})</span>}
    </div>
  )
}
