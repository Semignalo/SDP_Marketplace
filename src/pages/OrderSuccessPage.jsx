import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../hooks/useAccount'
import { useSnapToken } from '../hooks/useCheckout'
import { Button, Skeleton, Badge } from '../components/ui'
import { extractErrorMessage } from '../lib/api'
import { loadSnap } from '../lib/snap'
import { useFormatPrice } from '../hooks/useCurrency'

const STATUS_META = {
  pending_payment: { label: 'Awaiting Payment', variant: 'warning', icon: Clock },
  processing:      { label: 'Paid — Processing', variant: 'success', icon: CheckCircle2 },
  shipped:         { label: 'Shipped',           variant: 'info',    icon: Package },
  completed:       { label: 'Completed',         variant: 'success', icon: CheckCircle2 },
  cancelled:       { label: 'Cancelled',         variant: 'danger',  icon: AlertTriangle },
}

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const paidFromCheckout = searchParams.get('paid') === '1'

  const { data: order, isLoading, error, refetch } = useOrder(orderNumber)
  const snapMut = useSnapToken()
  const formatPrice = useFormatPrice()

  const isPending = order?.status === 'pending_payment'

  const checkAndRefresh = async () => {
    try {
      await import('../lib/api').then(m => m.api.get(`/orders/${orderNumber}/check-status`))
    } catch { /* ignore */ }
    refetch()
  }

  // After paying via Snap, sync the status from Midtrans once.
  useEffect(() => {
    if (paidFromCheckout && orderNumber) checkAndRefresh()
  }, [paidFromCheckout, orderNumber])

  // Poll while still pending (only on manual access, not right after checkout).
  useEffect(() => {
    if (!isPending || paidFromCheckout) return
    const id = setInterval(() => refetch(), 4000)
    return () => clearInterval(id)
  }, [isPending, paidFromCheckout, refetch])

  const handlePay = async () => {
    try {
      const { token, client_key, is_production } = await snapMut.mutateAsync(orderNumber)
      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
      snap.pay(token, {
        onSuccess: () => { toast.success('Payment successful!'); checkAndRefresh() },
        onPending: () => { toast.info('Payment pending.'); refetch() },
        onError: () => toast.error('Payment failed. Please try again.'),
        onClose: () => refetch(),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  // If arriving from checkout with ?paid=1, show the success state immediately.
  const showSuccess = paidFromCheckout || (order && order.status !== 'pending_payment' && order.status !== 'cancelled')

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="max-w-xl mx-auto">
        {paidFromCheckout ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-success text-white mb-6">
              <CheckCircle2 size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Payment Successful!</h1>
            <p className="mt-2 text-sm text-ink-muted">Thank you, your order is being processed by the vendor.</p>
          </div>
        ) : (
          <Header order={order} />
        )}

        <div className="mt-8 border border-line rounded-lg p-6 bg-paper">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error || !order ? (
            <p className="text-sm text-ink-muted text-center">Order details not found.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="eyebrow">Order Number</p>
                  <p className="text-lg font-bold text-ink tabular-nums">{order.order_number}</p>
                </div>
                {(() => {
                  const meta = STATUS_META[order.status] || { label: order.status, variant: 'neutral' }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                })()}
              </div>

              <dl className="mt-6 space-y-2.5 text-sm">
                <Row label="Total" value={formatPrice(order.total)} bold />
                <Row label="Courier" value={order.shipping_courier || '-'} />
                <Row label="Recipient" value={order.shipping_name} />
              </dl>

              {/* Pay button only shows on manual access (not right after checkout) while still pending */}
              {isPending && !paidFromCheckout && (
                <div className="mt-6 pt-6 border-t border-line space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handlePay}
                    loading={snapMut.isPending}
                    leadingIcon={<CreditCard size={16} />}
                  >
                    Pay Now
                  </Button>
                  <p className="text-2xs text-ink-muted text-center">
                    Secured via Midtrans — VA, QRIS, GoPay, credit card, and more.
                  </p>
                </div>
              )}

              {order.status === 'processing' && !paidFromCheckout && (
                <div className="mt-6 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft">
                  ✓ Payment received. Your order is being packed by the vendor.
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="mt-6 px-4 py-3 bg-state-danger/5 border border-state-danger/20 rounded text-xs text-state-danger">
                  This order has been cancelled. Product stock has been restored.
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/akun/pesanan/${orderNumber}`}>
            <Button variant="outline" leadingIcon={<Package size={16} />}>Order Details</Button>
          </Link>
          <Link to="/products">
            <Button variant="ghost" trailingIcon={<ArrowRight size={16} />}>Keep Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Header({ order }) {
  const status = order?.status
  if (status === 'processing' || status === 'shipped' || status === 'completed') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-success text-white mb-6">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Payment Successful</h1>
        <p className="mt-2 text-sm text-ink-muted">Thank you, your order is being processed.</p>
      </div>
    )
  }
  if (status === 'cancelled') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-danger text-white mb-6">
          <AlertTriangle size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Order Cancelled</h1>
        <p className="mt-2 text-sm text-ink-muted">This order was not carried through.</p>
      </div>
    )
  }
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-ink text-white mb-6">
        <CheckCircle2 size={32} strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Order Received</h1>
      <p className="mt-2 text-sm text-ink-muted">Complete payment to process your order.</p>
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
