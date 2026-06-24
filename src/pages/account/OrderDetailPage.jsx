import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, RefreshCw, FileText, CreditCard, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../../hooks/useAccount'
import { useSnapToken, useCancelOrder } from '../../hooks/useCheckout'
import { Badge, Card, Skeleton, EmptyState, Button, Modal } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDateTime } from '../../lib/utils'
import { loadSnap } from '../../lib/snap'

const STATUS = {
  awaiting_quote:  { label: 'Awaiting Shipping Quote', variant: 'warning' },
  pending_payment: { label: 'Awaiting Payment', variant: 'warning' },
  processing:      { label: 'Processing',       variant: 'neutral' },
  shipped:         { label: 'Shipped',          variant: 'neutral' },
  completed:       { label: 'Completed',        variant: 'success' },
  cancelled:       { label: 'Cancelled',        variant: 'danger'  },
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error, refetch, isRefetching } = useOrder(orderNumber)
  const snapMut = useSnapToken()
  const cancelMut = useCancelOrder()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const handleCheckStatus = async () => {
    try {
      const { data } = await import('../../lib/api').then(m => m.api.get(`/orders/${orderNumber}/check-status`))
      await refetch()
      if (data.data.status === 'pending_payment') {
        toast.message('No payment detected yet')
      } else {
        toast.success('Status updated!')
      }
    } catch {
      await refetch()
    }
  }

  const handlePay = async () => {
    try {
      const { token, client_key, is_production } = await snapMut.mutateAsync(orderNumber)
      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
      snap.pay(token, {
        onSuccess: () => handleCheckStatus(),
        onPending: () => { toast.info('Payment pending.'); refetch() },
        onError: () => toast.error('Payment failed. Please try again.'),
        onClose: () => refetch(),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync(orderNumber)
      toast.success('Order cancelled.')
      setCancelModalOpen(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setCancelModalOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <EmptyState
        title="We couldn't find this order."
        action={<Link to="/akun/pesanan"><Button variant="outline">Back to Orders</Button></Link>}
      />
    )
  }

  const statusInfo = STATUS[order.status] || { label: order.status, variant: 'neutral' }
  const isPending = order.status === 'pending_payment'
  const isAwaitingQuote = order.status === 'awaiting_quote'

  return (
    <div className="space-y-6">
      <Link to="/akun/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Back
      </Link>

      <Card padding="md">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow">Order Number</p>
            <p className="text-base font-semibold text-ink tabular-nums">{order.order_number}</p>
            <p className="text-xs text-ink-muted mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <Link
              to={`/akun/pesanan/${orderNumber}/invoice`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs border border-line rounded px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-paper-soft transition-colors"
            >
              <FileText size={12} /> Invoice
            </Link>
          </div>
        </div>
      </Card>

      {isAwaitingQuote && (
        <Card padding="md" className="bg-paper-soft">
          <p className="text-sm font-semibold text-ink">We're calculating your international shipping</p>
          <p className="text-sm text-ink-muted mt-1">Our team is preparing a shipping quote for this order. You'll get an email once it's ready, and you can pay right from this page.</p>
        </Card>
      )}

      {isPending && (
        <Card padding="none" className="overflow-hidden">
          <div className="bg-paper-soft px-5 py-4 border-b border-line flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="eyebrow">Amount Due</p>
              <p className="text-2xl font-bold text-ink tabular-nums mt-0.5">{formatRupiah(order.total)}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isRefetching}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border border-line rounded px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
              Check status
            </button>
          </div>

          <div className="px-5 py-5 space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={handlePay}
              loading={snapMut.isPending}
              leadingIcon={<CreditCard size={16} />}
            >
              Pay now
            </Button>
            <p className="text-2xs text-ink-muted text-center">
              Secured via Midtrans — VA, QRIS, GoPay, credit card, and more.
            </p>
            <div className="pt-1 border-t border-line">
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-state-danger hover:underline py-2"
              >
                <XCircle size={13} /> Cancel order
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <InfoCard icon={<MapPin size={16} />} title="Shipping Address">
          <p className="text-sm font-semibold">{order.shipping_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>
        <InfoCard icon={<Truck size={16} />} title="Shipping">
          <p className="text-sm">{order.shipping_courier || 'Courier not picked yet'}</p>
          {order.tracking_number && (
            <p className="text-xs text-ink-muted mt-1">Tracking number: <span className="text-ink tabular-nums">{order.tracking_number}</span></p>
          )}
          {order.tracking_number && order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline mt-2"
            >
              Track on {order.shipping_courier} site →
            </a>
          )}
        </InfoCard>
      </div>

      <Card padding="none" className="overflow-hidden">
        <h3 className="eyebrow px-5 py-3 border-b border-line bg-paper-soft">
          Order Items
        </h3>
        <ul className="divide-y divide-line">
          {(order.items || []).map((item) => (
            <li key={item.id} className="p-5 flex gap-4">
              <div className="h-20 w-20 bg-paper-warm overflow-hidden rounded shrink-0">
                {item.product?.primary_image && (
                  <img src={item.product.primary_image} alt={item.product_name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xs uppercase tracking-widest text-ink-muted">{item.vendor?.name}</p>
                <p className="text-sm text-ink line-clamp-2 mt-0.5">{item.product_name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-ink-muted tabular-nums">
                    {formatRupiah(item.price)} × {item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-ink tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md">
        <h3 className="eyebrow mb-4">Summary</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatRupiah(Number(order.subtotal) + Number(order.tier_discount || 0))} />
          {order.tier_discount > 0 && (
            <Row label={`${order.tier_name || ''} tier discount`} value={<span className="text-state-success">−{formatRupiah(order.tier_discount)}</span>} />
          )}
          <Row label="Shipping" value={formatRupiah(order.shipping_cost)} />
          <div className="pt-2 mt-2 border-t border-line">
            <Row label="Total" value={formatRupiah(order.total)} bold />
          </div>
        </dl>
      </Card>

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel this order?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>No</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelMut.isPending}>Yes, cancel</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Order <span className="font-semibold text-ink">{orderNumber}</span> will be cancelled and stock will be returned. This can't be undone.
        </p>
      </Modal>
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 eyebrow mb-3">
        <span className="text-ink">{icon}</span> {title}
      </div>
      {children}
    </Card>
  )
}

function Row({ label, value, bold = false }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={bold ? 'text-sm font-semibold' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={`tabular-nums ${bold ? 'text-base font-bold' : 'text-sm text-ink'}`}>{value}</dd>
    </div>
  )
}
