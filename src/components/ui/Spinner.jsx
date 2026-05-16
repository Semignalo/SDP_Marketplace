import { cn } from '../../lib/utils'

export function Spinner({ size = 24, className = '' }) {
  return (
    <span
      className={cn('inline-block border-2 border-current border-t-transparent rounded-pill animate-spin text-ink-muted', className)}
      style={{ width: size, height: size }}
      aria-label="Memuat"
    />
  )
}
