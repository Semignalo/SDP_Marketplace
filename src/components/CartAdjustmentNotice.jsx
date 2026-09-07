import { Info } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'

const STALE_AFTER_MS = 60_000

/**
 * Banner persisten di CartPage kalau useCartAvailabilitySync barusan hapus/turunkan
 * qty item karena region berubah — jaga-jaga toast-nya kelewat (misal terjadi di
 * halaman lain sebelum user pindah ke /keranjang).
 */
export default function CartAdjustmentNotice() {
  const adjustment = useUIStore((s) => s.lastCartAdjustment)
  const clear = useUIStore((s) => s.clearLastCartAdjustment)

  if (!adjustment || Date.now() - adjustment.at > STALE_AFTER_MS) return null

  const { removed, reduced } = adjustment
  if (!removed.length && !reduced.length) return null

  return (
    <div className="mb-4 flex items-start gap-2 rounded border border-line bg-paper-warm px-3 py-2.5">
      <span className="mt-px text-ink-muted shrink-0">
        <Info size={14} strokeWidth={1.8} />
      </span>
      <div className="flex-1 text-2xs leading-relaxed text-ink-soft">
        {removed.length > 0 && (
          <p>Removed from cart (not available in your region): <span className="font-medium text-ink">{removed.join(', ')}</span></p>
        )}
        {reduced.length > 0 && (
          <p>Quantity reduced: <span className="font-medium text-ink">{reduced.join(', ')}</span></p>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-ink-muted hover:text-ink text-2xs shrink-0"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  )
}
