import { cn } from '../../lib/utils'

const VARIANTS = {
  neutral: 'bg-paper-warm text-ink-soft border border-line',
  ink: 'bg-ink text-white',
  light: 'bg-white text-ink border border-line',
  success: 'bg-state-success/10 text-state-success border border-state-success/20',
  warning: 'bg-state-warning/10 text-state-warning border border-state-warning/20',
  danger: 'bg-state-danger text-white',
  outline: 'border border-line text-ink-soft bg-paper',
  accent: 'bg-accent-soft text-accent-hover border border-accent/20',
}

const SIZES = {
  sm: 'text-2xs px-1.5 py-0.5',
  md: 'text-2xs px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
}

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-sm',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
