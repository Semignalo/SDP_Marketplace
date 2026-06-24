import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import { useAdminOrders } from '../../hooks/useAdmin'
import { Input, Select, Badge, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { formatRupiah, formatDateTime } from '../../lib/utils'

const STATUS_BADGE = {
  awaiting_quote: { label: 'Menunggu Kuotasi Ongkir', variant: 'warning' },
  pending_payment: { label: 'Menunggu Bayar', variant: 'warning' },
  processing: { label: 'Diproses', variant: 'neutral' },
  shipped: { label: 'Dikirim', variant: 'info' },
  completed: { label: 'Selesai', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(search && { search }), ...(status && { status }) }), [page, search, status])

  const { data, isLoading } = useAdminOrders(params)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Pesanan</h2>
        <p className="text-sm text-ink-muted mt-1">Semua pesanan cross-vendor.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari no. pesanan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-56">
          <option value="">Semua status</option>
          <option value="awaiting_quote">Menunggu Kuotasi Ongkir</option>
          <option value="pending_payment">Menunggu Bayar</option>
          <option value="processing">Diproses</option>
          <option value="shipped">Dikirim</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_120px_80px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span>Pesanan</span>
          <span>Customer</span>
          <span>Reseller</span>
          <span className="text-right">Total</span>
          <span>Status</span>
          <span></span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<ShoppingCart size={40} strokeWidth={1.2} />} title="Tidak ada pesanan" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((o) => {
              const badge = STATUS_BADGE[o.status] || { label: o.status, variant: 'neutral' }
              return (
                <li key={o.id} className="p-4 md:px-5 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_80px] md:gap-4 md:items-center">
                  <div>
                    <Link to={`/admin/pesanan/${o.order_number}`} className="text-sm font-semibold tabular-nums text-ink hover:underline">
                      {o.order_number}
                    </Link>
                    <p className="text-xs text-ink-muted tabular-nums mt-0.5">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-sm text-ink-soft">{o.customer?.name || '—'}</p>
                    <p className="text-xs text-ink-muted">{o.customer?.email}</p>
                  </div>
                  <div className="mt-1 md:mt-0">
                    {o.reseller ? (
                      <>
                        <p className="text-sm text-ink-soft">{o.reseller.name}</p>
                        <p className="text-2xs text-ink-muted tabular-nums">{o.reseller.reseller_code}</p>
                      </>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </div>
                  <p className="text-sm md:text-right font-semibold tabular-nums mt-1 md:mt-0">{formatRupiah(o.total)}</p>
                  <div className="mt-2 md:mt-0"><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <div className="mt-2 md:mt-0 md:text-right">
                    <Link to={`/admin/pesanan/${o.order_number}`} className="text-xs text-ink-muted hover:text-ink hover:underline">
                      Detail →
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
      )}
    </div>
  )
}
