import { useState } from 'react'
import { ArrowDownToLine, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminWithdrawals, useUpdateWithdrawalStatus } from '../../hooks/useAdmin'
import { Badge, Skeleton, EmptyState, Button, Modal, Pagination } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDate, cn } from '../../lib/utils'

const STATUS = {
  pending:  { label: 'Processing', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Processing' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminWithdrawalsPage() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminWithdrawals({ status: filter || undefined, page })
  const updateStatus = useUpdateWithdrawalStatus()

  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState(null) // 'approved' | 'rejected'
  const [adminNotes, setAdminNotes] = useState('')

  const openModal = (w, act) => {
    setSelected(w)
    setAction(act)
    setAdminNotes('')
  }

  const handleConfirm = async () => {
    try {
      await updateStatus.mutateAsync({ id: selected.id, status: action, admin_notes: adminNotes || undefined })
      toast.success(action === 'approved' ? 'Withdrawal approved' : 'Withdrawal rejected')
      setSelected(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const pendingCount = data?.summary?.pending || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Commission Withdrawals</h2>
        <p className="text-sm text-ink-muted mt-1">Manage reseller commission withdrawal requests.</p>
      </div>

      {pendingCount > 0 && (
        <div className="px-4 py-3 bg-state-warning/10 border border-state-warning/30 rounded text-sm text-ink-soft">
          There <strong className="text-ink">{pendingCount} request(s)</strong> awaiting processing.
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setFilter(f.value); setPage(1) }}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-medium transition border',
              filter === f.value ? 'bg-ink text-white border-ink' : 'bg-paper text-ink-soft border-line hover:border-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1.2fr_1.4fr_120px_140px_120px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span>Date</span>
          <span>Reseller</span>
          <span>Destination Account</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
          <span></span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !data?.data?.length ? (
          <div className="p-10">
            <EmptyState icon={<ArrowDownToLine size={40} strokeWidth={1.2} />} title="No withdrawal requests" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data.data.map((w) => {
              const s = STATUS[w.status] || { label: w.status, variant: 'neutral' }
              return (
                <li key={w.id} className="p-4 md:px-5 md:grid md:grid-cols-[1fr_1.2fr_1.4fr_120px_140px_120px] md:gap-4 md:items-center">
                  <p className="text-xs text-ink-muted tabular-nums">{formatDate(w.created_at)}</p>

                  <div className="mt-1 md:mt-0">
                    <p className="text-sm font-medium text-ink">{w.user?.name}</p>
                    <p className="text-2xs text-ink-muted">{w.user?.email}</p>
                  </div>

                  <div className="mt-1 md:mt-0">
                    <p className="text-sm text-ink">{w.bank_name} — {w.bank_account_number}</p>
                    <p className="text-xs text-ink-muted">a/n {w.bank_account_name}</p>
                    {w.notes && <p className="text-2xs text-ink-muted mt-0.5 italic">"{w.notes}"</p>}
                  </div>

                  <p className="text-sm font-bold tabular-nums md:text-right mt-2 md:mt-0">{formatRupiah(w.amount)}</p>

                  <div className="mt-2 md:mt-0">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    {w.admin_notes && <p className="text-2xs text-ink-muted mt-1">{w.admin_notes}</p>}
                  </div>

                  {w.status === 'pending' ? (
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <button
                        type="button"
                        onClick={() => openModal(w, 'approved')}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1.5 bg-state-success text-white rounded hover:opacity-90 transition"
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(w, 'rejected')}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1.5 border border-state-danger text-state-danger rounded hover:bg-state-danger/5 transition"
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-2xs text-ink-muted mt-2 md:mt-0">{w.processed_at ? formatDate(w.processed_at) : '—'}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
      )}

      {/* Confirmation modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={action === 'approved' ? 'Approve Withdrawal?' : 'Reject Withdrawal?'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant={action === 'approved' ? 'primary' : 'danger'}
              onClick={handleConfirm}
              loading={updateStatus.isPending}
            >
              {action === 'approved' ? 'Yes, Approve' : 'Yes, Reject'}
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-paper-soft rounded space-y-1.5 text-sm">
              <p><span className="text-ink-muted">Reseller:</span> <strong>{selected.user?.name}</strong></p>
              <p><span className="text-ink-muted">Amount:</span> <strong>{formatRupiah(selected.amount)}</strong></p>
              <p><span className="text-ink-muted">Account:</span> {selected.bank_name} {selected.bank_account_number} a/n {selected.bank_account_name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft block mb-1.5">Note for the reseller (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                placeholder={action === 'approved' ? 'E.g.: Transferred' : 'E.g.: Invalid bank account'}
                className="w-full px-3 py-2.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
