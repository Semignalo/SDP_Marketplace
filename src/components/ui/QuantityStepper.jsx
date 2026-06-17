import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
}

export function QuantityStepper({ value, min = 1, max, onChange, size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md

  return (
    <div className={cn('inline-flex items-center border border-line rounded', className)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={cn('inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40 transition', s)}
        aria-label="Decrease quantity"
      >
        <Minus size={12} />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={max != null && value >= max}
        className={cn('inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40 transition', s)}
        aria-label="Increase quantity"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
