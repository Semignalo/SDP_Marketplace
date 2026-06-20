import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, Clock, AlertTriangle, CreditCard, Truck, Mail, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useGuestOrder, useGuestSnapToken, useResendGuestTrackingLink } from '../hooks/useGuestCheckout'
import { getGuestToken } from '../lib/guestOrders'
import { api, extractErrorMessage } from '../lib/api'
import { Button, Skeleton, Badge } from '../components/ui'
import { formatRupiah } from '../lib/utils'
import { loadSnap } from '../lib/snap'

const STATUS_META = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning', icon: Clock },
  processing: { label: 'Dibayar — Diproses', variant: 'success', icon: CheckCircle2 },
  shipped: { label: 'Dikirim', variant: 'info', icon: Package },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: AlertTriangle },
}

export default function GuestTrackPage() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const paidFromCheckout = searchParams.get('paid') === '1'
  const token = searchParams.get('token') || getGuestToken(orderNumber)

  const { data: order, isLoading, error, refetch } = useGuestOrder(orderNumber, token)
  const snapMut = useGuestSnapToken()

  const isPending = order?.status === 'pending_payment'

  const checkAndRefresh = async () => {
    try {
      await api.get(`/guest/orders/${orderNumber}/check-status`, { params: { token } })
    } catch { /* ignore */ }
    refetch()
  }

  useEffect(() => {
    if (paidFromCheckout && orderNumber && token) checkAndRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidFromCheckout, orderNumber, token])

  useEffect(() => {
    if (!isPending || paidFromCheckout) return
    const id = setInterval(() => refetch(), 5000)
    return () => clearInterval(id)
  }, [isPending, paidFromCheckout, refetch])

  const handlePay = async () => {
    try {
      const { token: snapToken, client_key, is_production } = await snapMut.mutateAsync({ orderNumber, token })
      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
      snap.pay(snapToken, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); checkAndRefresh() },
        onPending: () => { toast.info('Pembayaran pending.'); refetch() },
        onError: () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => refetch(),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  if (!token) {
    return <ResendLinkForm orderNumber={orderNumber} />
  }

  const showSuccess = paidFromCheckout || (order && order.status !== 'pending_payment' && order.status !== 'cancelled')

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="max-w-xl mx-auto">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center h-16 w-16 rounded-pill mb-6 ${
            order?.status === 'cancelled' ? 'bg-state-danger text-white' : showSuccess ? 'bg-state-success text-white' : 'bg-ink text-white'
          }`}>
            {order?.status === 'cancelled'
              ? <AlertTriangle size={32} strokeWidth={1.5} />
              : <CheckCircle2 size={32} strokeWidth={1.5} />}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
            {paidFromCheckout ? 'Pembayaran Berhasil!' : showSuccess ? 'Pesanan Diproses' : order?.status === 'cancelled' ? 'Pesanan Dibatalkan' : 'Lacak Pesanan'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isPending ? 'Selesaikan pembayaran untuk memproses pesananmu.' : 'Terima kasih, pesananmu sedang diproses.'}
          </p>
        </div>

        {order && <SaveTrackingBanner orderNumber={orderNumber} token={token} email={order.guest_email} />}

        <div className="mt-8 border border-line rounded-lg p-6 bg-paper">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error || !order ? (
            <p className="text-sm text-ink-muted text-center">
              Pesanan tidak ditemukan atau token tidak valid.
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-muted">Nomor Pesanan</p>
                  <p className="text-lg font-bold text-ink tabular-nums">{order.order_number}</p>
                </div>
                {(() => {
                  const meta = STATUS_META[order.status] || { label: order.status, variant: 'neutral' }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                })()}
              </div>

              <dl className="mt-6 space-y-2.5 text-sm">
                <Row label="Subtotal" value={formatRupiah(order.subtotal)} />
                {order.tier_discount > 0 && (
                  <Row
                    label={`Diskon Tier ${order.tier_name || ''}`}
                    value={<span className="text-state-success">-{formatRupiah(order.tier_discount)}</span>}
                  />
                )}
                <Row label="Total" value={formatRupiah(order.total)} bold />
                <Row label="Kurir" value={order.shipping_courier || '-'} />
                <Row label="Penerima" value={order.shipping_name} />
                {order.tracking_number && <Row label="No. Resi" value={order.tracking_number} />}
                {order.tracking_number && order.tracking_url && (
                  <Row
                    label=" "
                    value={
                      <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                        Lacak di situs {order.shipping_courier} →
                      </a>
                    }
                  />
                )}
              </dl>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <ul className="mt-6 pt-6 border-t border-line divide-y divide-line -my-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-3 flex gap-3">
                      <div className="h-12 w-12 bg-paper-warm overflow-hidden rounded shrink-0">
                        {item.product?.primary_image && <img src={item.product.primary_image} alt={item.product_name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">{formatRupiah(item.price)} × {item.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {isPending && (
                <div className="mt-6 pt-6 border-t border-line space-y-3">
                  <Button variant="accent" fullWidth size="lg" onClick={handlePay} loading={snapMut.isPending} leadingIcon={<CreditCard size={16} />}>
                    Bayar Sekarang
                  </Button>
                  <p className="text-2xs text-ink-muted text-center">
                    Aman via Midtrans — VA, QRIS, GoPay, kartu kredit, dan lainnya.
                  </p>
                </div>
              )}

              {order.status === 'processing' && (
                <div className="mt-6 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-state-success" /> Pembayaran diterima. Pesananmu sedang dikemas.
                </div>
              )}
              {order.status === 'shipped' && (
                <div className="mt-6 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft flex items-center gap-2">
                  <Truck size={14} /> Pesanan dalam perjalanan.
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="mt-6 px-4 py-3 bg-state-danger/5 border border-state-danger/20 rounded text-xs text-state-danger">
                  Pesanan dibatalkan.
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/products">
            <Button variant="ghost" trailingIcon={<ArrowRight size={16} />}>Lanjut Belanja</Button>
          </Link>
        </div>
      </div>
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

function SaveTrackingBanner({ orderNumber, token, email }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = `${window.location.origin}/lacak/${orderNumber}?token=${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link disalin')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin link')
    }
  }

  return (
    <div className="mt-6 px-4 py-3.5 bg-paper-soft border border-line rounded-lg flex items-start gap-3 flex-wrap">
      <Mail size={16} className="text-ink-muted mt-0.5 shrink-0" />
      <p className="text-xs text-ink-soft flex-1 min-w-[200px]">
        Link lacak sudah dikirim ke{' '}
        {email ? <span className="font-medium text-ink">{email}</span> : 'emailmu'}.
        Simpan halaman ini untuk cek status pesananmu kapanpun.
      </p>
      <Button variant="outline" size="sm" onClick={handleCopy} leadingIcon={copied ? <Check size={14} /> : <Copy size={14} />}>
        {copied ? 'Tersalin' : 'Salin Link'}
      </Button>
    </div>
  )
}

function ResendLinkForm({ orderNumber }) {
  const [orderInput, setOrderInput] = useState(orderNumber || '')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const resendMut = useResendGuestTrackingLink()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await resendMut.mutateAsync({ orderNumber: orderInput.trim(), guestEmail: email.trim() })
      setSent(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="container-page py-20">
      <div className="max-w-md mx-auto text-center">
        <AlertTriangle size={40} className="mx-auto text-ink-faint mb-4" />
        <h1 className="text-xl font-bold text-ink">Token tidak ditemukan</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Gunakan link lacak pesanan dari email konfirmasi, atau kirim ulang lewat form di bawah.
        </p>

        {sent ? (
          <div className="mt-6 px-4 py-3.5 bg-paper-soft border border-line rounded-lg text-sm text-ink-soft text-left">
            Jika nomor pesanan dan email cocok, link lacak sudah dikirim ulang ke emailmu. Cek inbox (atau folder spam) beberapa menit ke depan.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
            <div>
              <label className="text-xs font-medium text-ink-muted">Nomor Pesanan</label>
              <input
                type="text"
                required
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                placeholder="SDP-20260619-XXXXX"
                className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Email Checkout</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
            <Button type="submit" variant="accent" fullWidth loading={resendMut.isPending}>
              Kirim Ulang Link Lacak
            </Button>
          </form>
        )}

        <Link to="/products" className="inline-block mt-6">
          <Button variant="outline">Lanjut Belanja</Button>
        </Link>
      </div>
    </div>
  )
}
