import { Info } from 'lucide-react'

/**
 * Muncul kalau harga keranjang berubah karena negara tujuan kirim punya harga sendiri.
 *
 * Perubahannya sendiri disengaja (harga ditentukan tujuan kirim, bukan region yang
 * sedang dilihat) — yang tidak boleh terjadi adalah customer melihat totalnya berubah
 * tanpa penjelasan.
 */
export default function RepricedNotice({ changed, country }) {
  if (!changed) return null

  return (
    <div className="mb-3 flex items-start gap-2 rounded border border-line bg-paper-warm px-3 py-2.5">
      <span className="mt-px text-ink-muted shrink-0">
        <Info size={14} strokeWidth={1.8} />
      </span>
      <p className="text-2xs leading-relaxed text-ink-soft">
        Prices updated for delivery to <span className="font-medium text-ink">{country}</span>.
        This destination has its own pricing.
      </p>
    </div>
  )
}
