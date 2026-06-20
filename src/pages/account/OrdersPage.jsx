import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { useOrders } from '../../hooks/useAccount'
import { Badge, Button, Card, EmptyState, Pagination, Skeleton } from '../../components/ui'
import { formatRupiah, formatDate, cn } from '../../lib/utils'

const STATUS = {
  pending_payment: { label: 'Awaiting Payment', variant: 'warning' },
  processing: { label: 'Processing', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'neutral' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending_payment', label: 'Awaiting Payment' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
]

export default function OrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders({ status: status || undefined, page })
  const orders = data?.data || []
  const meta = data?.meta || { last_page: 1, current_page: 1 }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Order History</h2>
        <p className="text-sm text-ink-muted mt-1">Track status and details for every order.</p>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setStatus(f.value); setPage(1) }}
            className={cn(
              'shrink-0 h-9 px-4 rounded text-xs font-semibold uppercase tracking-wider transition border',
              status === f.value
                ? 'bg-ink text-white border-ink'
                : 'border-line text-ink-muted hover:border-ink hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package size={40} strokeWidth={1.2} />}
          title="No orders yet."
          description="Once you check out, your orders will show up here."
          action={<Link to="/products"><Button variant="outline">Start shopping</Button></Link>}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((order) => {
              const statusInfo = STATUS[order.status] || { label: order.status, variant: 'neutral' }
              return (
                <li key={order.id}>
                  <Link to={`/akun/pesanan/${order.order_number}`} className="block">
                    <Card padding="md" interactive>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-2xs uppercase tracking-widest text-ink-muted">
                            {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm font-semibold text-ink mt-0.5 tabular-nums">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            {order.items_count} products · {order.shipping_courier || 'courier not picked yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          <p className="text-sm font-bold text-ink tabular-nums mt-2">
                            {formatRupiah(order.total)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-ink-faint" />
                      </div>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
          {meta.last_page > 1 && (
            <div className="mt-8">
              <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
