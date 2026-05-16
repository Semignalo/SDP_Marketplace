import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminCommissions,
  useUpdateAdminCommissionStatus,
  useBulkMarkCommissionsPaid,
} from '../../hooks/useAdmin'
import { Badge, Select, Button, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDate, cn } from '../../lib/utils'

const STATUS_LABELS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  earned: { label: 'Dikonfirmasi', variant: 'neutral' },
  paid: { label: 'Dibayar', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
}

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'earned', label: 'Dikonfirmasi' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export default function AdminCommissionsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(status && { status }) }), [page, status])

  const { data, isLoading } = useAdminCommissions(params)
  const updateStatus = useUpdateAdminCommissionStatus()
  const bulkPaid = useBulkMarkCommissionsPaid()

  const [selected, setSelected] = useState(new Set())

  const toggleSelect = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const selectableIds = (data?.data || [])
    .filter((c) => c.status === 'pending' || c.status === 'earned')
    .map((c) => c.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds))
  }

  const handleStatusChange = async (c, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id: c.id, status: newStatus })
      toast.success(`Status diubah ke ${newStatus}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleBulkPaid = async () => {
    if (selected.size === 0) return
    if (!confirm(`Tandai ${selected.size} komisi sebagai paid?`)) return
    try {
      await bulkPaid.mutateAsync(Array.from(selected))
      toast.success(`${selected.size} komisi ditandai paid`)
      setSelected(new Set())
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Komisi Reseller</h2>
        <p className="text-sm text-ink-muted mt-1">Kelola pembayaran komisi reseller.</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <SummaryCard label="Total" value={summary ? formatRupiah(summary.total) : null} accent />
        <SummaryCard label="Menunggu" value={summary ? formatRupiah(summary.pending) : null} />
        <SummaryCard label="Dikonfirmasi" value={summary ? formatRupiah(summary.earned) : null} />
        <SummaryCard label="Sudah Dibayar" value={summary ? formatRupiah(summary.paid) : null} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatus(f.value); setPage(1); setSelected(new Set()) }}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-medium transition border',
                status === f.value ? 'bg-ink text-white border-ink' : 'bg-paper text-ink-soft border-line hover:border-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <Button leadingIcon={<Check size={16} />} onClick={handleBulkPaid} loading={bulkPaid.isPending}>
            Tandai {selected.size} sebagai Paid
          </Button>
        )}
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[40px_1.2fr_1fr_1fr_120px_140px_80px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
          <label className="inline-flex items-center">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={selectableIds.length === 0} className="h-4 w-4 accent-ink" />
          </label>
          <span>Pesanan</span>
          <span>Reseller</span>
          <span>Customer</span>
          <span className="text-right">Komisi</span>
          <span>Status</span>
          <span></span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<Wallet size={40} strokeWidth={1.2} />} title="Tidak ada komisi" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((c) => {
              const badge = STATUS_LABELS[c.status] || { label: c.status, variant: 'neutral' }
              const canSelect = c.status === 'pending' || c.status === 'earned'
              return (
                <li key={c.id} className="p-4 md:px-5 md:grid md:grid-cols-[40px_1.2fr_1fr_1fr_120px_140px_80px] md:gap-4 md:items-center">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      disabled={!canSelect}
                      className="h-4 w-4 accent-ink"
                    />
                  </label>
                  <div className="mt-2 md:mt-0">
                    <Link to={`/admin/pesanan/${c.order?.order_number}`} className="text-sm font-semibold tabular-nums text-ink hover:underline">
                      {c.order?.order_number || '—'}
                    </Link>
                    <p className="text-xs text-ink-muted tabular-nums mt-0.5">{formatDate(c.created_at)} · order total {formatRupiah(c.order_total)}</p>
                  </div>
                  <div className="mt-1 md:mt-0">
                    <p className="text-sm text-ink-soft">{c.reseller?.name}</p>
                    <p className="text-2xs text-ink-faint tabular-nums">{c.reseller?.reseller_code}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-1 md:mt-0">{c.customer?.name || '—'}</p>
                  <div className="mt-2 md:mt-0 md:text-right">
                    <p className="text-sm font-bold tabular-nums">{formatRupiah(c.amount)}</p>
                    <p className="text-2xs text-ink-faint tabular-nums">rate {c.rate}%</p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Select value={c.status} onChange={(e) => handleStatusChange(c, e.target.value)} className="h-8 text-xs">
                      <option value="pending">Menunggu</option>
                      <option value="earned">Dikonfirmasi</option>
                      <option value="paid">Dibayar</option>
                      <option value="cancelled">Dibatalkan</option>
                    </Select>
                  </div>
                  <div className="md:text-right mt-2 md:mt-0">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination currentPage={data.meta.current_page} totalPages={data.meta.last_page} onPageChange={setPage} />
      )}
    </div>
  )
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className={cn('border rounded-lg p-4', accent ? 'bg-ink text-white border-ink' : 'bg-paper border-line')}>
      <p className={cn('text-2xs uppercase tracking-widest', accent ? 'text-white/60' : 'text-ink-muted')}>{label}</p>
      <div className="mt-2 min-h-[24px]">
        {value === null ? <Skeleton className={cn('h-6 w-20', accent && 'bg-white/20')} /> : <p className="text-lg font-bold tabular-nums">{value}</p>}
      </div>
    </div>
  )
}
