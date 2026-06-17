import { Check } from 'lucide-react'
import { Card } from '../ui'
import { cn, formatRupiah } from '../../lib/utils'

// Unified fallback courier rates — used when the live shipping-rate check is unavailable.
export const FALLBACK_COURIER_RATES = [
  { code: 'jne_reg', name: 'JNE', service: 'REG', cost: 18000, eta: '2-3 days' },
  { code: 'jne_yes', name: 'JNE', service: 'YES', cost: 28000, eta: '1 day' },
  { code: 'tiki_reg', name: 'TIKI', service: 'REG', cost: 16000, eta: '2-3 days' },
  { code: 'pos_kilat', name: 'POS', service: 'Kilat', cost: 12000, eta: '3-5 days' },
]

export function Stepper({ steps, current, onJump }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, idx) => {
        const active = s.id === current
        const done = s.id < current
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => onJump?.(s.id)}
              className={cn(
                'flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-1 px-1 sm:px-3 py-2 rounded transition',
                done && 'text-ink hover:bg-paper-warm cursor-pointer',
                active && 'bg-ink text-white',
                !done && !active && 'text-ink-faint cursor-default',
              )}
            >
              <span className={cn(
                'h-7 w-7 inline-flex items-center justify-center rounded-pill text-xs font-bold shrink-0',
                done && 'bg-ink text-white',
                active && 'bg-paper text-ink shadow-card',
                !done && !active && 'border border-line text-ink-faint',
              )}>
                {done ? <Check size={14} /> : s.id}
              </span>
              <span className="text-2xs sm:text-sm font-semibold text-center">{s.title}</span>
            </button>
            {idx < steps.length - 1 && <span className="h-px w-4 bg-line hidden md:block" />}
          </div>
        )
      })}
    </div>
  )
}

export function StepCard({ title, action, children }) {
  return (
    <Card padding="md" as="section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

export function CourierOption({ courier, selected, freeShipping, freeMax, onSelect }) {
  const afterSubsidy = freeShipping ? Math.max(0, courier.cost - freeMax) : courier.cost
  const isFullyFree = freeShipping && afterSubsidy === 0

  return (
    <label
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg cursor-pointer transition',
        selected ? 'bg-paper-soft shadow-card' : 'shadow-card hover:shadow-hover',
      )}
    >
      <input type="radio" name="courier" checked={selected} onChange={onSelect} className="h-4 w-4 accent-ink" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{courier.name} — {courier.service}</p>
          <div className="text-right">
            {isFullyFree
              ? <span className="text-sm font-semibold text-state-success">FREE</span>
              : <span className="text-sm font-semibold tabular-nums">{formatRupiah(afterSubsidy)}</span>}
            {freeShipping && !isFullyFree && (
              <p className="text-2xs text-ink-faint line-through">{formatRupiah(courier.cost)}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">Estimated {courier.eta}</p>
      </div>
    </label>
  )
}

export function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={bold ? 'text-sm font-semibold' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={cn('tabular-nums', bold ? 'text-lg font-bold' : 'text-sm text-ink')}>{value}</dd>
    </div>
  )
}
