import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
}

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min
  let v = Math.floor(n)
  if (v < min) v = min
  if (max != null && v > max) v = max
  return v
}

export function QuantityStepper({ value, min = 1, max, onChange, size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md
  const [draft, setDraft] = useState(String(value))

  // Sync draft kalau value berubah dari luar (mis. tombol +/- atau parent state).
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = clamp(parseInt(draft, 10), min, max)
    setDraft(String(parsed))
    if (parsed !== value) onChange(parsed)
  }

  return (
    <div className={cn('inline-flex items-center border border-line rounded', className)}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1, min, max))}
        disabled={value <= min}
        className={cn('inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40 transition', s)}
        aria-label="Decrease quantity"
      >
        <Minus size={12} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur()
        }}
        className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1, min, max))}
        disabled={max != null && value >= max}
        className={cn('inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40 transition', s)}
        aria-label="Increase quantity"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
