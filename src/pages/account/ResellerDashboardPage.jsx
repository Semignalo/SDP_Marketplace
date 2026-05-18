import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, Wallet, Users, Package, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useResellerSummary, useResellerCommissions } from '../../hooks/useReseller'
import { Badge, Skeleton, EmptyState, Pagination } from '../../components/ui'
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
]

export default function ResellerDashboardPage() {
  const { data: summary, isLoading: sumLoading } = useResellerSummary()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(status && { status }) }), [page, status])
  const { data: commissionData, isLoading: comLoading } = useResellerCommissions(params)
  const [copied, setCopied] = useState(false)

  const referralUrl = summary?.reseller_code
    ? `${window.location.origin}/register?ref=${summary.reseller_code}`
    : ''

  const handleCopy = async () => {
    if (!referralUrl) return
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success('Link referral disalin')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink">Dashboard Komisi</h2>
        <p className="text-sm text-ink-muted mt-1">Pantau komisi & link referral kamu.</p>
      </div>

      {/* Referral link card */}
      <div className="border border-line rounded-lg p-5 bg-paper-soft">
        <p className="text-2xs uppercase tracking-widest text-ink-muted mb-2">Link Referral Kamu</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink tabular-nums truncate">
            {referralUrl || '—'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!referralUrl}
            className={cn(
              'h-11 px-4 inline-flex items-center gap-2 rounded text-sm font-medium transition',
              copied ? 'bg-state-success text-white' : 'bg-ink text-white hover:bg-ink-soft disabled:opacity-50',
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Bagikan link ini. Setiap pembelian customer via link kamu otomatis dapat komisi
          {summary?.rate && <strong className="text-ink"> {summary.rate}%</strong>}.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet size={18} />}
          label="Total Komisi"
          value={sumLoading ? null : formatRupiah(summary?.total_earned || 0)}
          accent
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Menunggu"
          value={sumLoading ? null : formatRupiah(summary?.pending || 0)}
        />
        <StatCard
          icon={<Package size={18} />}
          label="Total Order"
          value={sumLoading ? null : (summary?.orders_count || 0).toString()}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Pelanggan Unik"
          value={sumLoading ? null : (summary?.customers_count || 0).toString()}
        />
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setStatus(f.value); setPage(1) }}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-medium transition border',
              status === f.value
                ? 'bg-ink text-white border-ink'
                : 'bg-paper text-ink-soft border-line hover:border-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Commissions table */}
      <section className="border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
          <span>Pesanan</span>
          <span>Customer</span>
          <span>Tanggal</span>
          <span className="text-right">Komisi</span>
          <span className="text-right">Status</span>
        </div>

        {comLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : commissionData?.data?.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Wallet size={40} strokeWidth={1.2} />}
              title="Belum ada komisi"
              description="Bagikan link referral kamu untuk mulai dapat komisi."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {commissionData?.data?.map((c) => {
              const status = STATUS_LABELS[c.status] || { label: c.status, variant: 'neutral' }
              return (
                <li key={c.id} className="p-4 md:px-5 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px] md:gap-4 md:items-center">
                  <div>
                    <Link to={`/akun/pesanan/${c.order?.order_number}`} className="text-sm font-semibold tabular-nums text-ink hover:underline">
                      {c.order?.order_number || '—'}
                    </Link>
                    <p className="text-xs text-ink-muted mt-0.5 tabular-nums">Total order: {formatRupiah(c.order_total)}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-2 md:mt-0">{c.customer?.name || '—'}</p>
                  <p className="text-xs text-ink-muted mt-1 md:mt-0 tabular-nums">{formatDate(c.created_at)}</p>
                  <div className="md:text-right mt-2 md:mt-0">
                    <p className="text-sm font-bold text-ink tabular-nums">{formatRupiah(c.amount)}</p>
                    <p className="text-2xs text-ink-faint tabular-nums">rate {c.rate}%</p>
                  </div>
                  <div className="md:text-right mt-2 md:mt-0">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {commissionData?.meta?.last_page > 1 && (
        <Pagination
          currentPage={commissionData.meta.current_page}
          totalPages={commissionData.meta.last_page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className={cn(
      'border rounded-lg p-5',
      accent ? 'bg-ink text-white border-ink' : 'bg-paper border-line',
    )}>
      <div className={cn('flex items-center gap-2 text-2xs uppercase tracking-widest', accent ? 'text-white/60' : 'text-ink-muted')}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 min-h-[28px]">
        {value === null
          ? <Skeleton className={cn('h-6 w-24', accent && 'bg-white/20')} />
          : <p className="text-xl md:text-2xl font-bold tabular-nums">{value}</p>}
      </div>
    </div>
  )
}
