import { Crown, Award } from 'lucide-react'
import { cn } from '../lib/utils'

const LEVEL_STYLE = {
  1: 'bg-paper-warm text-ink-soft border-line',
  2: 'bg-ink-faint/10 text-ink-soft border-ink-faint',
  3: 'bg-ink/10 text-ink border-ink-muted',
  4: 'bg-ink text-white border-ink',
  5: 'bg-gradient-to-r from-ink to-ink-soft text-white border-ink',
}

// Variant untuk background gelap (TierCard header)
const LEVEL_STYLE_DARK = {
  1: 'bg-orange-950/70 text-orange-200 border-orange-700',
  2: 'bg-slate-600/70 text-slate-100 border-slate-400',
  3: 'bg-amber-800/70 text-amber-200 border-amber-600',
  4: 'bg-blue-900/70 text-blue-200 border-blue-600',
  5: 'bg-purple-900/70 text-purple-200 border-purple-600',
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
        Belum bertier
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
