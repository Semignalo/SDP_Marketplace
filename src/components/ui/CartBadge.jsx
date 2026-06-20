import { cn } from '../../lib/utils'

// Badge jumlah item keranjang — satu sumber kebenaran untuk Navbar & MobileBottomNav.
// Posisi diatur lewat className; angka di-cap "9+".
export function CartBadge({ count, className = '' }) {
  if (!count) return null
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-pill bg-ink text-white text-2xs font-bold tabular-nums',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
