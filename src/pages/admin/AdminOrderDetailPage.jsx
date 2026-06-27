import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, MapPin, Truck, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminOrder, useUpdateAdminOrderStatus, useSetShippingQuote } from '../../hooks/useAdmin'
import { Badge, Button, Input, Select, Textarea, Skeleton, EmptyState } from '../../components/ui'
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

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error } = useAdminOrder(orderNumber)
  const update = useUpdateAdminOrderStatus()
  const setQuote = useSetShippingQuote()

  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [quoteCost, setQuoteCost] = useState('')
  const [quoteCourier, setQuoteCourier] = useState('')

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-40 w-full" /></div>
  }

  if (error || !order) {
    return <EmptyState title="Order not found" action={<Link to="/admin/pesanan"><Button variant="outline">Back</Button></Link>} />
  }

  const currentStatus = status || order.status
  const badge = STATUS_BADGE[order.status] || { label: order.status, variant: 'neutral' }

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        orderNumber,
        status: currentStatus,
        admin_notes: notes || order.admin_notes || '',
      })
      toast.success('Order status updated')
      setStatus('')
      setNotes('')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleSendQuote = async () => {
    if (!quoteCost || Number(quoteCost) < 0) {
      toast.error('Enter the shipping cost first')
      return
    }
    try {
      await setQuote.mutateAsync({
        orderNumber,
        shipping_cost: Number(quoteCost),
        shipping_courier: quoteCourier || undefined,
      })
      toast.success('Shipping quote sent, order is ready for payment')
      setQuoteCost('')
      setQuoteCourier('')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to order list
      </Link>

      <div className="bg-paper border border-line rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow">Order Number</p>
            <p className="text-base font-semibold text-ink tabular-nums">{order.order_number}</p>
            <p className="text-xs text-ink-muted mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Link to={`/admin/pesanan/${orderNumber}/invoice`} target="_blank">
              <Button variant="outline" leadingIcon={<FileText size={14} />}>Print Invoice</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status update */}
      <section className="bg-paper border border-line rounded-lg p-5">
        <h3 className="eyebrow mb-4">Update Status</h3>
        <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <Select label="New Status" value={currentStatus} onChange={(e) => setStatus(e.target.value)}>
            <option value="awaiting_quote">Awaiting Shipping Quote</option>
            <option value="pending_payment">Awaiting Payment</option>
            <option value="processing">Processing (verify payment)</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Textarea label="Admin Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={order.admin_notes || 'E.g.: manually verified BCA transfer'} />
          <Button onClick={handleSave} loading={update.isPending}>Save</Button>
        </div>
        {order.payment_verified_at && (
          <p className="mt-3 text-xs text-state-success">✓ Payment verified: {formatDateTime(order.payment_verified_at)}</p>
        )}
      </section>

      {order.status === 'awaiting_quote' && (
        <section className="bg-paper border border-line rounded-lg p-5">
          <h3 className="eyebrow mb-1">Send International Shipping Quote</h3>
          <p className="text-xs text-ink-muted mb-4">This order ships to {order.shipping_country || 'abroad'} — enter the shipping cost manually to unlock payment.</p>
          <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
            <Input label="Shipping Cost (Rp)" type="number" min="0" value={quoteCost} onChange={(e) => setQuoteCost(e.target.value)} placeholder="150000" />
            <Input label="Courier (optional)" value={quoteCourier} onChange={(e) => setQuoteCourier(e.target.value)} placeholder="DHL Express / FedEx" />
            <Button onClick={handleSendQuote} loading={setQuote.isPending}>Send Quote & Request Payment</Button>
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <InfoCard icon={<User size={16} />} title="Customer">
          <p className="text-sm font-semibold">{order.customer?.name}</p>
          <p className="text-xs text-ink-muted">{order.customer?.email}</p>
          <p className="text-xs text-ink-muted">{order.customer?.phone}</p>
        </InfoCard>
        <InfoCard icon={<MapPin size={16} />} title="Shipping Address">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">{order.shipping_name}</p>
            {order.shipping_country && order.shipping_country !== 'Indonesia' && <Badge variant="warning">International</Badge>}
          </div>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>
        <InfoCard icon={<Truck size={16} />} title="Shipping">
          <p className="text-sm">{order.shipping_courier || 'Not selected yet'}</p>
          {order.tracking_number && <p className="text-xs text-ink-muted mt-1">Tracking: <span className="text-ink tabular-nums">{order.tracking_number}</span></p>}
          {order.tracking_number && order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline mt-2"
            >
              Track on {order.shipping_courier} →
            </a>
          )}
        </InfoCard>
      </div>

      {order.reseller && (
        <InfoCard icon={<Wallet size={16} />} title="Reseller & Commission">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold">{order.reseller.name}</p>
              <p className="text-2xs text-ink-muted tabular-nums">Code: {order.reseller.reseller_code}</p>
            </div>
            {order.commission && (
              <>
                <div>
                  <p className="eyebrow">Commission</p>
                  <p className="text-sm font-semibold tabular-nums">{formatRupiah(order.commission.amount)}</p>
                  <p className="text-2xs text-ink-muted tabular-nums">rate {order.commission.rate}%</p>
                </div>
                <div>
                  <p className="eyebrow">Commission Status</p>
                  <Badge variant={order.commission.status === 'paid' ? 'success' : order.commission.status === 'cancelled' ? 'danger' : 'neutral'}>
                    {order.commission.status}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </InfoCard>
      )}

      <section className="bg-paper border border-line rounded-lg overflow-hidden">
        <h3 className="eyebrow px-5 py-3 border-b border-line bg-paper-soft">Order Items</h3>
        <ul className="divide-y divide-line">
          {(order.items || []).map((item) => (
            <li key={item.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_slug}`} target="_blank" className="text-sm text-ink hover:underline">
                  {item.product_name}
                </Link>
                <p className="text-2xs text-ink-muted mt-0.5">{item.vendor?.name}</p>
                <p className="text-xs text-ink-muted mt-1 tabular-nums">{formatRupiah(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4 border-t border-line space-y-2 text-sm">
          <Row label="Subtotal" value={formatRupiah(Number(order.subtotal) + Number(order.tier_discount || 0))} />
          {order.tier_discount > 0 && (
            <Row label={`${order.tier_name || ''} Tier Discount`} value={<span className="text-state-success">−{formatRupiah(order.tier_discount)}</span>} />
          )}
          <Row label="Shipping" value={formatRupiah(order.shipping_cost)} />
          <div className="pt-2 mt-2 border-t border-line">
            <Row label="Total" value={formatRupiah(order.total)} bold />
          </div>
        </div>
      </section>

      {order.admin_notes && (
        <div className="bg-paper-soft border border-line rounded-lg p-4">
          <p className="eyebrow mb-1">Admin Notes</p>
          <p className="text-sm text-ink-soft">{order.admin_notes}</p>
        </div>
      )}
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

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={bold ? 'text-sm font-semibold' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={`tabular-nums ${bold ? 'text-base font-bold' : 'text-sm text-ink'}`}>{value}</dd>
    </div>
  )
}
