import { Crown, Award } from 'lucide-react'
import { cn } from '../lib/utils'

// Style per level (monochrome with subtle accent)
const LEVEL_STYLE = {
  1: 'bg-paper-warm text-ink-soft border-line',           // Member — neutral
  2: 'bg-ink-faint/10 text-ink-soft border-ink-faint',    // Silver
  3: 'bg-ink/10 text-ink border-ink-muted',               // Gold
  4: 'bg-ink text-white border-ink',                      // Platinum
  5: 'bg-gradient-to-r from-ink to-ink-soft text-white border-ink', // VIP
}

const SIZE = {
  sm: 'text-2xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

export default function TierBadge({ tier, size = 'md', showIcon = true, className = '' }) {
  if (!tier) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-pill border font-medium uppercase tracking-widest',
        'border-line text-ink-faint bg-paper',
        SIZE[size],
        className,
      )}>
        Belum bertier
      </span>
    )
  }

  const styleClass = LEVEL_STYLE[tier.level] || LEVEL_STYLE[1]
  const Icon = tier.level >= 4 ? Crown : Award

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-pill border font-bold uppercase tracking-widest',
      styleClass,
      SIZE[size],
      className,
    )}>
      {showIcon && <Icon size={size === 'lg' ? 14 : 11} strokeWidth={2} />}
      {tier.name}
    </span>
  )
}
