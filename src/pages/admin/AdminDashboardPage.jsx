import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ShoppingCart, Users, Store, Package, TrendingUp, ArrowRight, Clock, Truck } from 'lucide-react'
import { useAdminSummary, useAdminRevenueChart } from '../../hooks/useAdmin'
import { Skeleton, EmptyState, Select, Input } from '../../components/ui'
import { useFormatPrice, useFormatPriceShort } from '../../hooks/useCurrency'
import { cn } from '../../lib/utils'

const RANGE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
]

export default function AdminDashboardPage() {
  const [range, setRange] = useState('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const dateParams = useMemo(() => {
    if (range === 'all') return { all: 1 }
    if (range === 'custom') return customFrom && customTo ? { date_from: customFrom, date_to: customTo } : { days: 30 }
    return { days: Number(range) }
  }, [range, customFrom, customTo])

  const { data: s, isLoading } = useAdminSummary(dateParams)
  const { data: chart = [], isLoading: chartLoading } = useAdminRevenueChart(dateParams)
  const formatPrice = useFormatPrice()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold text-ink">Dashboard</h1>
          <p className="text-xs text-ink-muted mt-0.5">Revenue, orders & top sellers — Awaiting Payment and account totals below are always current.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="text-xs w-36">
            {RANGE_PRESETS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          {range === 'custom' && (
            <>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-36" />
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-36" />
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp size={18} />} label="Recognized Revenue" value={isLoading ? null : formatPrice(s?.revenue || 0)} accent />
        <StatCard icon={<Package size={18} />} label="Product Revenue" value={isLoading ? null : formatPrice(s?.revenue_products || 0)} hint="Net of tier discount" />
        <StatCard icon={<Truck size={18} />} label="Total Shipping" value={isLoading ? null : formatPrice(s?.revenue_shipping || 0)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<ShoppingCart size={18} />} label="Total Orders" value={isLoading ? null : String(s?.orders_count || 0)} hint={`${s?.orders_pending || 0} awaiting payment`} />
        <StatCard icon={<Wallet size={18} />} label="AOV" value={isLoading ? null : formatPrice(s?.aov || 0)} hint="Average Order Value" />
        <StatCard icon={<Clock size={18} />} label="Awaiting Payment" value={isLoading ? null : String(s?.orders_pending || 0)} danger={!isLoading && s?.orders_pending > 0} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Customers" value={isLoading ? null : String(s?.users_count || 0)} compact />
        <StatCard icon={<Users size={18} />} label="Active Referrers" value={isLoading ? null : String(s?.referrers_count || 0)} compact />
        <StatCard icon={<Store size={18} />} label="Active Vendors" value={isLoading ? null : String(s?.vendors_count || 0)} compact />
        <StatCard icon={<Package size={18} />} label="Active Products" value={isLoading ? null : String(s?.products_count || 0)} compact />
      </div>

      <section className="bg-paper border border-line rounded-lg p-5 lg:p-6">
        <h2 className="text-base font-semibold text-ink mb-4">Revenue</h2>
        {chartLoading ? <Skeleton className="h-32 w-full" /> : <RevenueChart data={chart} />}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-paper border border-line rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">Top Vendors</h2>
            <Link to="/admin/vendors" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <RankList loading={isLoading} items={s?.top_vendors} type="vendor" />
        </section>

        <section className="bg-paper border border-line rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">Top Products</h2>
            <Link to="/admin/products" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
              All <ArrowRight size={12} />
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
      <div className={cn('flex items-center gap-2 text-2xs font-bold uppercase tracking-eyebrow', accent ? 'text-white/60' : 'text-ink-muted')}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 min-h-[28px]">
        {value === null
          ? <Skeleton className={cn('h-7 w-24', accent && 'bg-white/20')} />
          : <p className={cn('font-bold tabular-nums', compact ? 'text-lg' : 'text-xl md:text-2xl')}>{value}</p>}
      </div>
      {hint && <p className={cn('text-2xs mt-1', accent ? 'text-white/50' : 'text-ink-muted')}>{hint}</p>}
    </div>
  )
}

function RankList({ loading, items, type }) {
  const formatPrice = useFormatPrice()

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
          title="No data yet"
          description="This will show up once there are orders."
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
            <p className="text-xs text-ink-muted tabular-nums">{type === 'vendor' ? `${item.qty} items sold` : `${item.qty} sold`}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatPrice(item.revenue)}</p>
        </li>
      ))}
    </ul>
  )
}

function RevenueChart({ data }) {
  const formatPriceShort = useFormatPriceShort()

  if (!data?.length) return null
  const max = Math.max(1, ...data.map((d) => d.total))
  const total = data.reduce((s, d) => s + d.total, 0)
  const orders = data.reduce((s, d) => s + d.orders, 0)

  return (
    <div>
      <p className="text-xs text-ink-muted tabular-nums mb-3">
        <span className="font-semibold text-ink">{formatPriceShort(total)}</span> · {orders} orders
      </p>

      <div className="flex items-end gap-px h-28">
        {data.map((d) => {
          const h = (d.total / max) * 100
          return (
            <div key={d.date} className="flex-1 h-full group relative flex flex-col justify-end" style={{ minWidth: 0 }}>
              <div
                className={cn('w-full transition', d.total > 0 ? 'bg-ink/70 hover:bg-ink' : 'bg-line')}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="opacity-0 group-hover:opacity-100 absolute -top-11 left-1/2 -translate-x-1/2 z-10 bg-ink text-white text-2xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition">
                <p className="tabular-nums font-semibold">{formatPriceShort(d.total)}</p>
                <p className="opacity-60">{d.orders} orders · {d.date}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-2xs text-ink-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
