import { Link } from 'react-router-dom'
import { Wallet, ShoppingCart, Users, Store, Package, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { useAdminSummary, useAdminRevenueChart } from '../../hooks/useAdmin'
import { Skeleton, EmptyState } from '../../components/ui'
import { formatRupiah, formatRupiahShort, cn } from '../../lib/utils'

export default function AdminDashboardPage() {
  const { data: s, isLoading } = useAdminSummary()
  const { data: chart = [], isLoading: chartLoading } = useAdminRevenueChart(30)

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={18} />} label="Revenue Diakui" value={isLoading ? null : formatRupiah(s?.revenue || 0)} accent />
        <StatCard icon={<ShoppingCart size={18} />} label="Total Pesanan" value={isLoading ? null : String(s?.orders_count || 0)} hint={`${s?.orders_pending || 0} menunggu bayar`} />
        <StatCard icon={<Wallet size={18} />} label="AOV" value={isLoading ? null : formatRupiah(s?.aov || 0)} hint="Average Order Value" />
        <StatCard icon={<Clock size={18} />} label="Menunggu Bayar" value={isLoading ? null : String(s?.orders_pending || 0)} danger={!isLoading && s?.orders_pending > 0} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Customer" value={isLoading ? null : String(s?.users_count || 0)} compact />
        <StatCard icon={<Users size={18} />} label="Referrer Aktif" value={isLoading ? null : String(s?.referrers_count || 0)} compact />
        <StatCard icon={<Store size={18} />} label="Vendor Aktif" value={isLoading ? null : String(s?.vendors_count || 0)} compact />
        <StatCard icon={<Package size={18} />} label="Produk Aktif" value={isLoading ? null : String(s?.products_count || 0)} compact />
      </div>

      <section className="bg-paper border border-line rounded-lg p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Revenue 30 Hari</h2>
            <p className="text-xs text-ink-muted mt-0.5">Hanya pesanan processing/shipped/completed.</p>
          </div>
        </div>
        {chartLoading ? <Skeleton className="h-48 w-full" /> : <RevenueChart data={chart} />}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-paper border border-line rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">Top Vendor</h2>
            <Link to="/admin/vendors" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
              Semua <ArrowRight size={12} />
            </Link>
          </div>
          <RankList loading={isLoading} items={s?.top_vendors} type="vendor" />
        </section>

        <section className="bg-paper border border-line rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">Top Produk</h2>
            <Link to="/admin/products" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
              Semua <ArrowRight size={12} />
            </Link>
          </div>
          <RankList loading={isLoading} items={s?.top_products} type="product" />
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, hint, accent, danger, compact }) {
  return (
    <div className={cn(
      'border rounded-lg',
      compact ? 'p-4' : 'p-5',
      accent && 'bg-ink text-white border-ink',
      danger && 'border-state-danger/40',
      !accent && !danger && 'bg-paper border-line',
    )}>
      <div className={cn('flex items-center gap-2 text-2xs uppercase tracking-widest', accent ? 'text-white/60' : 'text-ink-muted')}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 min-h-[28px]">
        {value === null
          ? <Skeleton className={cn('h-7 w-24', accent && 'bg-white/20')} />
          : <p className={cn('font-bold tabular-nums', compact ? 'text-lg' : 'text-xl md:text-2xl')}>{value}</p>}
      </div>
      {hint && <p className={cn('text-2xs mt-1', accent ? 'text-white/50' : 'text-ink-faint')}>{hint}</p>}
    </div>
  )
}

function RankList({ loading, items, type }) {
  if (loading) {
    return (
      <div className="p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }
  if (!items?.length) {
    return (
      <div className="p-8">
        <EmptyState
          icon={type === 'vendor' ? <Store size={36} strokeWidth={1.2} /> : <Package size={36} strokeWidth={1.2} />}
          title="Belum ada data"
          description="Akan muncul setelah ada pesanan."
        />
      </div>
    )
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((item, idx) => (
        <li key={item.vendor_id || item.product_id} className="px-5 py-3 flex items-center gap-4">
          <span className="w-6 text-center text-sm font-bold text-ink-muted tabular-nums">{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <Link to={type === 'vendor' ? `/products?vendor=${item.slug}` : `/products/${item.slug}`} className="text-sm text-ink hover:underline line-clamp-1">
              {item.name}
            </Link>
            <p className="text-xs text-ink-muted tabular-nums">{type === 'vendor' ? `${item.qty} item terjual` : `${item.qty} terjual`}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.revenue)}</p>
        </li>
      ))}
    </ul>
  )
}

function RevenueChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(1, ...data.map((d) => d.total))
  const total30 = data.reduce((s, d) => s + d.total, 0)
  const orders30 = data.reduce((s, d) => s + d.orders, 0)

  return (
    <div>
      <div className="flex items-baseline gap-6 flex-wrap">
        <div>
          <p className="text-2xs uppercase tracking-widest text-ink-muted">Total 30 hari</p>
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(total30)}</p>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-widest text-ink-muted">Pesanan</p>
          <p className="text-2xl font-bold tabular-nums">{orders30}</p>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-[3px] h-40">
        {data.map((d) => {
          const h = (d.total / max) * 100
          return (
            <div key={d.date} className="flex-1 group relative" style={{ minWidth: 0 }}>
              <div
                className={cn('w-full rounded-sm transition', d.total > 0 ? 'bg-ink hover:bg-ink-soft' : 'bg-line')}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="opacity-0 group-hover:opacity-100 absolute -top-14 left-1/2 -translate-x-1/2 z-10 bg-ink text-white text-2xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                <p className="tabular-nums font-semibold">{formatRupiahShort(d.total)}</p>
                <p className="opacity-60">{d.orders} pesanan · {d.date}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-2xs text-ink-faint">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
