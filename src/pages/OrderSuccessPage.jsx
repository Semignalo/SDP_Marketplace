import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../hooks/useAccount'
import { useSnapToken } from '../hooks/useCheckout'
import { Button, Skeleton, Badge } from '../components/ui'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah } from '../lib/utils'
import { loadSnap } from '../lib/snap'

const STATUS_META = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning', icon: Clock },
  processing:      { label: 'Dibayar — Diproses',  variant: 'success', icon: CheckCircle2 },
  shipped:         { label: 'Dikirim',              variant: 'info',    icon: Package },
  completed:       { label: 'Selesai',              variant: 'success', icon: CheckCircle2 },
  cancelled:       { label: 'Dibatalkan',           variant: 'danger',  icon: AlertTriangle },
}

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const paidFromCheckout = searchParams.get('paid') === '1'

  const { data: order, isLoading, error, refetch } = useOrder(orderNumber)
  const snapMut = useSnapToken()

  const isPending = order?.status === 'pending_payment'

  // Polling saat pending (hanya jika bukan dari checkout — sudah bayar)
  useEffect(() => {
    if (!isPending || paidFromCheckout) return
    const id = setInterval(() => refetch(), 4000)
    return () => clearInterval(id)
  }, [isPending, paidFromCheckout, refetch])

  const checkAndRefresh = async () => {
    try {
      await import('../lib/api').then(m => m.api.get(`/orders/${orderNumber}/check-status`))
    } catch { /* ignore */ }
    refetch()
  }

  const handlePay = async () => {
    try {
      const { token, client_key, is_production } = await snapMut.mutateAsync(orderNumber)
      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
      snap.pay(token, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); checkAndRefresh() },
        onPending: () => { toast.info('Pembayaran pending.'); refetch() },
        onError: () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => refetch(),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  // Kalau dari checkout dengan ?paid=1, langsung tampil success state
  const showSuccess = paidFromCheckout || (order && order.status !== 'pending_payment' && order.status !== 'cancelled')

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="max-w-xl mx-auto">
        {paidFromCheckout ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-success text-white mb-6">
              <CheckCircle2 size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Pembayaran Berhasil!</h1>
            <p className="mt-2 text-sm text-ink-muted">Terima kasih, pesananmu sedang diproses oleh vendor.</p>
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

              {/* Tombol bayar hanya muncul jika akses manual (bukan dari checkout) dan masih pending */}
              {isPending && !paidFromCheckout && (
                <div className="mt-6 pt-6 border-t border-line space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handlePay}
                    loading={snapMut.isPending}
                    leadingIcon={<CreditCard size={16} />}
                  >
                    Bayar Sekarang
                  </Button>
                  <p className="text-2xs text-ink-faint text-center">
                    Aman via Midtrans — VA, QRIS, GoPay, kartu kredit, dan lainnya.
                  </p>
                </div>
              )}

              {order.status === 'processing' && !paidFromCheckout && (
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

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={bold ? 'text-sm font-semibold' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={`tabular-nums ${bold ? 'text-base font-bold' : 'text-sm text-ink'}`}>{value}</dd>
    </div>
  )
}
