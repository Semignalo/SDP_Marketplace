import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Megaphone, ShoppingCart, TrendingUp, Wallet, Percent } from 'lucide-react'
import { useAdminAttribution } from '../../hooks/useAdmin'
import { Skeleton, EmptyState } from '../../components/ui'
import DateRangeFilter, { useDateRange } from '../../components/admin/DateRangeFilter'
import { useFormatPrice } from '../../hooks/useCurrency'
import { cn } from '../../lib/utils'

export default function AdminAttributionPage() {
  const dateRange = useDateRange()
  const { data, isLoading, isError } = useAdminAttribution(dateRange.params)
  const formatPrice = useFormatPrice()

  const totals = data?.totals
  const currency = data?.spend_currency
  const nonIdr = !!currency && currency !== 'IDR'

  // Spend datang dalam mata uang ad account. IDR ikut format region seperti revenue;
  // mata uang lain ditampilkan apa adanya (dan ROAS disembunyikan server).
  const formatSpend = (n) => (n == null ? '—' : nonIdr ? `${currency} ${Math.round(n).toLocaleString('en-US')}` : formatPrice(n))
  const formatRoas = (n) => (n == null ? '—' : `${n.toFixed(2)}x`)

  const adShare = totals?.revenue > 0 ? Math.round((totals.ad_revenue / totals.revenue) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold text-ink">Ad Attribution</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Paid orders and revenue by ad campaign — last click within 7 days. Sales come from SDP orders; spend comes from Meta.
          </p>
        </div>
        <DateRangeFilter {...dateRange} />
      </div>

      {data?.spend_status === 'not_configured' && (
        <Notice>Meta Ads isn’t connected, so spend and ROAS are hidden. Add <code>META_ADS_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> to the server .env.</Notice>
      )}
      {data?.spend_status === 'error' && (
        <Notice>Couldn’t reach Meta just now — showing sales only. Try again in a moment.</Notice>
      )}
      {nonIdr && (
        <Notice>The ad account bills in {currency}, so ROAS is hidden (revenue is in IDR).</Notice>
      )}
      {isError && <Notice>Couldn’t load attribution data.</Notice>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<TrendingUp size={18} />} label="Ad Revenue" value={isLoading ? null : formatPrice(totals?.ad_revenue || 0)} hint={`${adShare}% of all revenue`} accent />
        <Stat icon={<ShoppingCart size={18} />} label="Ad Orders" value={isLoading ? null : String(totals?.ad_orders || 0)} hint={`${totals?.direct_orders || 0} direct / other`} />
        <Stat icon={<Wallet size={18} />} label="Ad Spend" value={isLoading ? null : formatSpend(totals?.spend)} hint="From Meta" />
        <Stat icon={<Percent size={18} />} label="ROAS" value={isLoading ? null : formatRoas(totals?.roas)} hint="Ad revenue ÷ spend" />
      </div>

      <section className="bg-paper border border-line rounded-lg">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">Campaigns</h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !data?.campaigns?.length ? (
          <div className="p-8">
            <EmptyState
              icon={<Megaphone size={36} strokeWidth={1.2} />}
              title="No ad orders yet"
              description="Orders from links with UTM parameters will show up here once they’re paid."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-2xs font-bold uppercase tracking-eyebrow text-ink-muted border-b border-line">
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-3 py-3 text-right">Orders</th>
                  <th className="px-3 py-3 text-right">Revenue</th>
                  <th className="px-3 py-3 text-right">Spend</th>
                  <th className="px-5 py-3 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <CampaignRow
                    key={c.campaign_id || c.key || '(none)'}
                    campaign={c}
                    formatPrice={formatPrice}
                    formatSpend={formatSpend}
                    formatRoas={formatRoas}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function CampaignRow({ campaign: c, formatPrice, formatSpend, formatRoas }) {
  const [open, setOpen] = useState(false)
  const expandable = c.ads?.length > 0

  return (
    <Fragment>
      <tr className="border-b border-line last:border-0">
        <td className="px-5 py-3">
          <button
            type="button"
            onClick={() => expandable && setOpen((v) => !v)}
            className={cn('flex items-center gap-2 text-left', expandable ? 'cursor-pointer' : 'cursor-default')}
            aria-expanded={expandable ? open : undefined}
          >
            <span className="w-4 text-ink-muted">{expandable && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}</span>
            <span>
              <span className="text-ink font-medium line-clamp-1">{c.name}</span>
              {c.sources?.length > 0 && <span className="block text-2xs text-ink-muted">{c.sources.join(', ')}</span>}
            </span>
          </button>
        </td>
        <td className="px-3 py-3 text-right tabular-nums">{c.orders}</td>
        <td className="px-3 py-3 text-right tabular-nums font-semibold">{formatPrice(c.revenue)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatSpend(c.spend)}</td>
        <td className="px-5 py-3 text-right tabular-nums">{formatRoas(c.roas)}</td>
      </tr>
      {open && c.ads.map((ad) => (
        <tr key={ad.key || '(none)'} className="border-b border-line last:border-0 bg-paper-soft text-xs">
          <td className="pl-14 pr-3 py-2 text-ink-muted line-clamp-1">{ad.name}</td>
          <td className="px-3 py-2 text-right tabular-nums">{ad.orders}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatPrice(ad.revenue)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatSpend(ad.spend)}</td>
          <td className="px-5 py-2 text-right tabular-nums">{formatRoas(ad.roas)}</td>
        </tr>
      ))}
    </Fragment>
  )
}

function Notice({ children }) {
  return (
    <div className="border border-line bg-paper-soft rounded-lg px-4 py-3 text-xs text-ink-muted [&_code]:text-ink [&_code]:font-mono">
      {children}
    </div>
  )
}

function Stat({ icon, label, value, hint, accent }) {
  return (
    <div className={cn('border rounded-lg p-5', accent ? 'bg-ink text-white border-ink' : 'bg-paper border-line')}>
      <div className={cn('flex items-center gap-2 text-2xs font-bold uppercase tracking-eyebrow', accent ? 'text-white/60' : 'text-ink-muted')}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 min-h-[28px]">
        {value === null
          ? <Skeleton className={cn('h-7 w-24', accent && 'bg-white/20')} />
          : <p className="font-bold tabular-nums text-xl md:text-2xl">{value}</p>}
      </div>
      {hint && <p className={cn('text-2xs mt-1', accent ? 'text-white/50' : 'text-ink-muted')}>{hint}</p>}
    </div>
  )
}
