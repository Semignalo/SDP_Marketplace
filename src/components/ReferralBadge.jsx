import { X, BadgeCheck } from 'lucide-react'
import { useReferralStore } from '../stores/useReferralStore'
import { toast } from 'sonner'

export default function ReferralBadge() {
  const code = useReferralStore((s) => s.getActive())
  const clear = useReferralStore((s) => s.clear)

  if (!code) return null

  const handleClear = () => {
    clear()
    toast.message('Kode referral dihapus')
  }

  return (
    <div className="bg-paper-soft border-b border-line">
      <div className="container-page py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <BadgeCheck size={14} className="text-ink" />
          <span>Belanja via referral <strong className="text-ink tabular-nums">{code}</strong></span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-ink-muted hover:text-ink text-xs inline-flex items-center gap-1"
          aria-label="Hapus kode referral"
        >
          <X size={12} /> Hapus
        </button>
      </div>
    </div>
  )
}
