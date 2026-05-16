import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, CreditCard, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../hooks/useAccount'
import { useSnapToken } from '../hooks/useCheckout'
import { usePublicSettings } from '../hooks/useProducts'
import { Button, Skeleton, Badge } from '../components/ui'
import { extractErrorMessage } from '../lib/api'
import { loadSnap } from '../lib/snap'
import { formatRupiah } from '../lib/utils'

const STATUS_META = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning', icon: Clock },
  processing: { label: 'Dibayar — Diproses', variant: 'success', icon: CheckCircle2 },
  shipped: { label: 'Dikirim', variant: 'info', icon: Package },
  completed: { label: 'Selesai', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', variant: 'danger', icon: AlertTriangle },
}

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error, refetch } = useOrder(orderNumber)
  const snapTokenMut = useSnapToken()
  const { data: settings } = usePublicSettings()

  const [paying, setPaying] = useState(false)
  const isPending = order?.status === 'pending_payment'

  // Polling order status setiap 4 detik selama pending_payment
  useEffect(() => {
    if (!isPending) return
    const id = setInterval(() => refetch(), 4000)
    return () => clearInterval(id)
  }, [isPending, refetch])

  const handlePay = async () => {
    setPaying(true)
    try {
      const { token, client_key, is_production } = await snapTokenMut.mutateAsync(orderNumber)

      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })

      snap.pay(token, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil!')
          refetch()
        },
        onPending: () => {
          toast.message('Pembayaran tertunda, menunggu konfirmasi bank')
          refetch()
        },
        onError: () => {
          toast.error('Pembayaran gagal')
          refetch()
        },
        onClose: () => {
          // user menutup popup tanpa selesai
        },
      })
    } catch (err) {
      const status = err.response?.status
      if (status === 503) {
        toast.error('Midtrans belum dikonfigurasi. Admin perlu set MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env')
      } else {
        toast.error(extractErrorMessage(err))
      }
    } finally {
      setPaying(false)
    }
  }

  const midtransConfigured = !!settings?.midtrans_client_key

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="max-w-xl mx-auto">
        <Header order={order} />

        <div className="mt-8 border border-line rounded-lg p-6 bg-paper">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error || !order ? (
            <p className="text-sm text-ink-muted text-center">Detail pesanan tidak ditemukan.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-faint">Nomor Pesanan</p>
                  <p className="text-lg font-bold text-ink tabular-nums">{order.order_number}</p>
                </div>
                {(() => {
                  const meta = STATUS_META[order.status] || { label: order.status, variant: 'neutral' }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                })()}
              </div>

              <dl className="mt-6 space-y-2.5 text-sm">
                <Row label="Total" value={formatRupiah(order.total)} bold />
                <Row label="Kurir" value={order.shipping_courier || '-'} />
                <Row label="Penerima" value={order.shipping_name} />
              </dl>

              {isPending && (
                <PaymentSection
                  configured={midtransConfigured}
                  loading={paying || snapTokenMut.isPending}
                  onPay={handlePay}
                />
              )}

              {order.status === 'processing' && (
                <div className="mt-6 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft">
                  ✓ Pembayaran diterima. Pesananmu sedang dikemas oleh vendor.
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="mt-6 px-4 py-3 bg-state-danger/5 border border-state-danger/20 rounded text-xs text-state-danger">
                  Pesanan dibatalkan. Stok produk sudah dikembalikan.
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/akun/pesanan/${orderNumber}`}>
            <Button variant="outline" leadingIcon={<Package size={16} />}>Detail Pesanan</Button>
          </Link>
          <Link to="/products">
            <Button variant="ghost" trailingIcon={<ArrowRight size={16} />}>Lanjut Belanja</Button>
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Pembayaran Berhasil</h1>
        <p className="mt-2 text-sm text-ink-muted">Terima kasih, pesananmu sedang diproses.</p>
      </div>
    )
  }
  if (status === 'cancelled') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-danger text-white mb-6">
          <AlertTriangle size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Pesanan Dibatalkan</h1>
        <p className="mt-2 text-sm text-ink-muted">Pesanan ini tidak diteruskan.</p>
      </div>
    )
  }
  // pending_payment / loading
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-ink text-white mb-6">
        <CheckCircle2 size={32} strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Pesanan Diterima</h1>
      <p className="mt-2 text-sm text-ink-muted">Selesaikan pembayaran untuk memproses pesananmu.</p>
    </div>
  )
}

function PaymentSection({ configured, loading, onPay }) {
  return (
    <div className="mt-6 pt-6 border-t border-line">
      <p className="text-2xs uppercase tracking-widest text-ink-muted mb-3">Pembayaran</p>
      {configured ? (
        <Button fullWidth size="lg" onClick={onPay} loading={loading} leadingIcon={<CreditCard size={16} />}>
          Bayar Sekarang
        </Button>
      ) : (
        <div className="px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft leading-relaxed">
          <strong>Mode dev:</strong> Midtrans belum dikonfigurasi. Set <code className="text-ink">MIDTRANS_SERVER_KEY</code> dan <code className="text-ink">MIDTRANS_CLIENT_KEY</code> di <code className="text-ink">sdp-api/.env</code> (sandbox keys dari dashboard.midtrans.com), lalu refresh.
        </div>
      )}
      <p className="mt-2 text-2xs text-ink-faint text-center">Pembayaran via Midtrans (Snap). Status akan auto-refresh setelah bayar.</p>
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
