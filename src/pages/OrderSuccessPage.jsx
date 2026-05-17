import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../hooks/useAccount'
import { useConfirmPayment } from '../hooks/useCheckout'
import { Button, Skeleton, Badge } from '../components/ui'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah } from '../lib/utils'

const STATUS_META = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning', icon: Clock },
  processing:      { label: 'Dibayar — Diproses',  variant: 'success', icon: CheckCircle2 },
  shipped:         { label: 'Dikirim',              variant: 'info',    icon: Package },
  completed:       { label: 'Selesai',              variant: 'success', icon: CheckCircle2 },
  cancelled:       { label: 'Dibatalkan',           variant: 'danger',  icon: AlertTriangle },
}

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error, refetch } = useOrder(orderNumber)
  const confirmMut = useConfirmPayment()

  const isPending = order?.status === 'pending_payment'

  // Polling saat pending
  useEffect(() => {
    if (!isPending) return
    const id = setInterval(() => refetch(), 4000)
    return () => clearInterval(id)
  }, [isPending, refetch])

  const handleConfirm = async () => {
    try {
      await confirmMut.mutateAsync(orderNumber)
      toast.success('Pembayaran dikonfirmasi! Pesanan sedang diproses.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

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
                <div className="mt-6 pt-6 border-t border-line space-y-3">
                  <p className="text-sm text-ink-muted">
                    Setelah melakukan transfer / pembayaran, klik tombol di bawah untuk konfirmasi.
                  </p>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleConfirm}
                    loading={confirmMut.isPending}
                    leadingIcon={<CheckCircle2 size={16} />}
                  >
                    Saya Sudah Bayar
                  </Button>
                  <p className="text-2xs text-ink-faint text-center">
                    Admin akan memverifikasi pembayaran dan memproses pesananmu.
                  </p>
                </div>
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
