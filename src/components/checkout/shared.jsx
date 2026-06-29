import { Check } from 'lucide-react'
import { Card } from '../ui'
import { cn } from '../../lib/utils'

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
        <h2 className="eyebrow">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
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
