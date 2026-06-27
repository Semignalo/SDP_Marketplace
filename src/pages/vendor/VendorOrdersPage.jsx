import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package } from 'lucide-react'
import { useVendorOrders } from '../../hooks/useVendor'
import { Input, Select, Badge, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { formatRupiah, formatDateTime, cn } from '../../lib/utils'

const STATUS_BADGE = {
  pending_payment: { label: 'Awaiting Payment', variant: 'warning' },
  processing: { label: 'Processing', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export default function VendorOrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    page,
    ...(search && { search }),
    ...(status && { status }),
  }), [page, search, status])

  const { data, isLoading } = useVendorOrders(params)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Orders</h2>
        <p className="text-sm text-ink-muted mt-1">Orders containing items from your store.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search order number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-52">
          <option value="">All statuses</option>
          <option value="pending_payment">Awaiting Payment</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_120px_100px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span className="text-right">Subtotal</span>
          <span>Status</span>
          <span className="text-right">Details</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Package size={40} strokeWidth={1.2} />}
              title="No orders yet"
              description="Customer orders for your products will show up here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((o) => {
              const badge = STATUS_BADGE[o.status] || { label: o.status, variant: 'neutral' }
              return (
                <li key={o.id} className="p-4 md:px-5 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_100px] md:gap-4 md:items-center">
                  <div>
                    <Link to={`/vendor/pesanan/${o.order_number}`} className="text-sm font-semibold tabular-nums text-ink hover:underline">
                      {o.order_number}
                    </Link>
                    <p className="text-xs text-ink-muted tabular-nums mt-0.5">{formatDateTime(o.created_at)}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-2 md:mt-0">{o.customer?.name || '—'}</p>
                  <p className="text-sm text-ink-soft mt-1 md:mt-0">{o.items_count} products</p>
                  <p className="text-sm md:text-right font-semibold tabular-nums mt-1 md:mt-0">{formatRupiah(o.vendor_subtotal)}</p>
                  <div className="mt-2 md:mt-0"><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <div className="mt-2 md:mt-0 md:text-right">
                    <Link to={`/vendor/pesanan/${o.order_number}`} className="text-xs text-ink-muted hover:text-ink underline-offset-4 hover:underline">
                      View →
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination
          currentPage={data.meta.current_page}
          lastPage={data.meta.last_page}
          onChange={setPage}
        />
      )}
    </div>
  )
}
