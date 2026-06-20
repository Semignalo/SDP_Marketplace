import { Link } from 'react-router-dom'
import { Package, ShoppingCart, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'
import { useVendorSummary, useVendorRevenueChart } from '../../hooks/useVendor'
import { Skeleton, EmptyState } from '../../components/ui'
import { formatRupiah, cn } from '../../lib/utils'

export default function VendorDashboardPage() {
  const { data: summary, isLoading } = useVendorSummary()
  const { data: chart = [], isLoading: chartLoading } = useVendorRevenueChart(30)

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Revenue Diakui"
          value={isLoading ? null : formatRupiah(summary?.revenue || 0)}
          hint="Hanya pesanan processing/shipped/completed"
          accent
        />
        <StatCard
          icon={<ShoppingCart size={18} />}
          label="Total Pesanan"
          value={isLoading ? null : String(summary?.orders_count || 0)}
        />
        <StatCard
          icon={<Package size={18} />}
          label="Produk Aktif"
          value={isLoading ? null : `${summary?.products_active || 0}/${summary?.products_count || 0}`}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Stok Menipis"
          value={isLoading ? null : String(summary?.products_low_stock || 0)}
          hint="Stok < 5"
          danger={!isLoading && summary?.products_low_stock > 0}
        />
      </div>

      <section className="bg-paper border border-line rounded-lg p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Revenue 30 hari terakhir</h2>
            <p className="text-xs text-ink-muted mt-0.5">Diakui saat status berubah ke processing.</p>
          </div>
        </div>
        {chartLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <RevenueChart data={chart} />
        )}
      </section>

      <section className="bg-paper border border-line rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">Top Produk</h2>
          <Link to="/vendor/produk" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
            Semua produk <ArrowRight size={12} />
          </Link>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !summary?.top_products?.length ? (
          <div className="p-8">
            <EmptyState
              icon={<Package size={36} strokeWidth={1.2} />}
              title="Belum ada penjualan"
              description="Top produk akan muncul setelah ada pesanan yang diproses."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {summary.top_products.map((p, idx) => (
              <li key={p.product_id} className="px-5 py-3 flex items-center gap-4">
                <span className="w-6 text-center text-sm font-bold text-ink-muted tabular-nums">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${p.slug}`} className="text-sm text-ink hover:underline line-clamp-1">{p.name}</Link>
                  <p className="text-xs text-ink-muted tabular-nums">{p.qty_sold} terjual</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatRupiah(p.revenue)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, hint, accent, danger }) {
  return (
    <div className={cn(
      'border rounded-lg p-5',
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
          : <p className="text-xl md:text-2xl font-bold tabular-nums">{value}</p>}
      </div>
      {hint && <p className={cn('text-2xs mt-1', accent ? 'text-white/50' : 'text-ink-muted')}>{hint}</p>}
    </div>
  )
}

function RevenueChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(1, ...data.map((d) => d.total))
  const total30 = data.reduce((s, d) => s + d.total, 0)

  return (
    <div>
      <p className="text-2xs uppercase tracking-widest text-ink-muted">Total 30 hari</p>
      <p className="text-2xl font-bold tabular-nums">{formatRupiah(total30)}</p>

      <div className="mt-6 flex items-end gap-[3px] h-40">
        {data.map((d) => {
          const h = (d.total / max) * 100
          return (
            <div
              key={d.date}
              className="flex-1 group relative"
              style={{ minWidth: 0 }}
            >
              <div
                className={cn(
                  'w-full transition rounded-sm',
                  d.total > 0 ? 'bg-ink hover:bg-ink-soft' : 'bg-line',
                )}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 z-10 bg-ink text-white text-2xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                <p className="tabular-nums font-semibold">{formatRupiah(d.total)}</p>
                <p className="opacity-60">{d.date}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-2xs text-ink-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
