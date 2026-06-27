import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useVendorOrder, useUpdateVendorOrderTracking } from '../../hooks/useVendor'
import { Badge, Button, Input, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDateTime } from '../../lib/utils'

const STATUS_BADGE = {
  awaiting_quote: { label: 'Awaiting Shipping Quote', variant: 'warning' },
  pending_payment: { label: 'Awaiting Payment', variant: 'warning' },
  processing: { label: 'Processing', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export default function VendorOrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error } = useVendorOrder(orderNumber)
  const update = useUpdateVendorOrderTracking()

  const [tracking, setTracking] = useState('')

  useEffect(() => {
    setTracking(order?.tracking_number || '')
  }, [order?.tracking_number])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <EmptyState
        title="Order not found"
        action={<Link to="/vendor/pesanan"><Button variant="outline">Back</Button></Link>}
      />
    )
  }

  const badge = STATUS_BADGE[order.status] || { label: order.status, variant: 'neutral' }
  const canShip = order.status === 'processing'

  const handleSaveTracking = async (markShipped = false) => {
    if (!tracking.trim()) {
      toast.error('Enter the tracking number')
      return
    }
    try {
      await update.mutateAsync({ orderNumber, tracking_number: tracking.trim(), mark_shipped: markShipped })
      toast.success(markShipped ? 'Order marked as shipped' : 'Tracking number saved')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/vendor/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="bg-paper border border-line rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow">Order Number</p>
            <p className="text-base font-semibold text-ink tabular-nums">{order.order_number}</p>
            <p className="text-xs text-ink-muted mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <InfoCard icon={<MapPin size={16} />} title="Customer & Shipping">
          <p className="text-sm font-semibold">{order.shipping_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>

        <InfoCard icon={<Truck size={16} />} title="Shipping & Tracking">
          <p className="text-sm">{order.shipping_courier || 'Courier not selected yet'}</p>
          <div className="mt-3 space-y-2">
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Tracking number"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSaveTracking(false)} loading={update.isPending}>
                Save Tracking
              </Button>
              {canShip && (
                <Button size="sm" onClick={() => handleSaveTracking(true)} loading={update.isPending}>
                  Save & Mark as Shipped
                </Button>
              )}
            </div>
            {order.tracking_number && order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline"
              >
                Track on {order.shipping_courier} →
              </a>
            )}
          </div>
        </InfoCard>
      </div>

      <section className="bg-paper border border-line rounded-lg overflow-hidden">
        <h3 className="eyebrow px-5 py-3 border-b border-line bg-paper-soft">
          Items From Your Store
        </h3>
        <ul className="divide-y divide-line">
          {(order.items || []).map((item) => (
            <li key={item.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_slug}`} className="text-sm text-ink hover:underline">
                  {item.product_name}
                </Link>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  {formatRupiah(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-line flex justify-between items-baseline">
          <p className="eyebrow">Your Subtotal</p>
          <p className="text-base font-bold tabular-nums">{formatRupiah(order.vendor_subtotal)}</p>
        </div>
      </section>
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-paper border border-line rounded-lg p-5">
      <div className="flex items-center gap-2 eyebrow mb-3">
        <span className="text-ink">{icon}</span> {title}
      </div>
      {children}
    </div>
  )
}
