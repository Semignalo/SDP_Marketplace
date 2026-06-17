import { Crown, Award } from 'lucide-react'
import { cn } from '../lib/utils'

const LEVEL_STYLE = {
  1: 'bg-paper-warm text-ink-soft border-line',
  2: 'bg-ink-faint/10 text-ink-soft border-ink-faint',
  3: 'bg-ink/10 text-ink border-ink-muted',
  4: 'bg-ink text-white border-ink',
  5: 'bg-gradient-to-r from-ink to-ink-soft text-white border-ink',
}

// Variant for dark backgrounds (TierCard header) — neutral-to-gold ladder using design tokens only
const LEVEL_STYLE_DARK = {
  1: 'bg-white/10 text-white/80 border-white/20',
  2: 'bg-white/15 text-white/90 border-white/25',
  3: 'bg-accent/70 text-white border-accent',
  4: 'bg-accent-hover/80 text-white border-accent-hover',
  5: 'bg-rating/80 text-ink border-rating',
}

const SIZE = {
  sm: 'text-2xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

export default function TierBadge({ tier, size = 'md', showIcon = true, onDark = false, className = '' }) {
  if (!tier) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-pill border font-medium uppercase tracking-widest',
        onDark ? 'border-white/20 text-white/50 bg-white/5' : 'border-line text-ink-faint bg-paper',
        SIZE[size],
        className,
      )}>
        No tier yet
      </span>
    )
  }

  const styleClass = onDark
    ? (LEVEL_STYLE_DARK[tier.level] || LEVEL_STYLE_DARK[1])
    : (LEVEL_STYLE[tier.level] || LEVEL_STYLE[1])

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
