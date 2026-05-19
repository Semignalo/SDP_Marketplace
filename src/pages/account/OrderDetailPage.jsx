import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, RefreshCw, FileText, CreditCard, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder } from '../../hooks/useAccount'
import { useSnapToken, useCancelOrder } from '../../hooks/useCheckout'
import { Badge, Skeleton, EmptyState, Button, Modal } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDateTime } from '../../lib/utils'
import { loadSnap } from '../../lib/snap'

const STATUS = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning' },
  processing:      { label: 'Diproses',            variant: 'neutral' },
  shipped:         { label: 'Dikirim',             variant: 'neutral' },
  completed:       { label: 'Selesai',             variant: 'success' },
  cancelled:       { label: 'Dibatalkan',          variant: 'danger'  },
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
        toast.message('Belum ada pembayaran yang terdeteksi')
      } else {
        toast.success('Status diperbarui!')
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
        onPending: () => { toast.info('Pembayaran pending.'); refetch() },
        onError: () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => refetch(),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync(orderNumber)
      toast.success('Pesanan berhasil dibatalkan.')
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
        title="Pesanan tidak ditemukan"
        action={<Link to="/akun/pesanan"><Button variant="outline">Kembali ke Pesanan</Button></Link>}
      />
    )
  }

  const statusInfo = STATUS[order.status] || { label: order.status, variant: 'neutral' }
  const isPending = order.status === 'pending_payment'

  return (
    <div className="space-y-6">
      <Link to="/akun/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Kembali
      </Link>

      {/* Header pesanan */}
      <div className="border border-line rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-faint">Nomor Pesanan</p>
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
      </div>

      {/* ── Panel Pembayaran (hanya saat pending) ── */}
      {isPending && (
        <div className="border border-line rounded-lg overflow-hidden">
          <div className="bg-paper-soft px-5 py-4 border-b border-line flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-2xs uppercase tracking-widest text-ink-faint">Total Tagihan</p>
              <p className="text-2xl font-bold text-ink tabular-nums mt-0.5">{formatRupiah(order.total)}</p>
            </div>
            <button
              onClick={handleCheckStatus}
              disabled={isRefetching}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border border-line rounded px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
              Cek Status
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
              Bayar Sekarang
            </Button>
            <p className="text-2xs text-ink-faint text-center">
              Aman via Midtrans — VA, QRIS, GoPay, kartu kredit, dan lainnya.
            </p>
            <div className="pt-1 border-t border-line">
              <button
                onClick={() => setCancelModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-state-danger hover:underline py-2"
              >
                <XCircle size={13} /> Batalkan Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <InfoCard icon={<MapPin size={16} />} title="Alamat Pengiriman">
          <p className="text-sm font-semibold">{order.shipping_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>
        <InfoCard icon={<Truck size={16} />} title="Pengiriman">
          <p className="text-sm">{order.shipping_courier || 'Kurir belum dipilih'}</p>
          {order.tracking_number && (
            <p className="text-xs text-ink-muted mt-1">No. Resi: <span className="text-ink tabular-nums">{order.tracking_number}</span></p>
          )}
        </InfoCard>
      </div>

      <section className="border border-line rounded-lg overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted px-5 py-3 border-b border-line bg-paper-soft">
          Item Pesanan
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
                <p className="text-2xs uppercase tracking-widest text-ink-faint">{item.vendor?.name}</p>
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
      </section>

      <section className="border border-line rounded-lg p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Ringkasan</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatRupiah(Number(order.subtotal) + Number(order.tier_discount || 0))} />
          {order.tier_discount > 0 && (
            <Row label={`Diskon Tier ${order.tier_name || ''}`} value={<span className="text-state-success">−{formatRupiah(order.tier_discount)}</span>} />
          )}
          <Row label="Ongkir" value={formatRupiah(order.shipping_cost)} />
          <div className="pt-2 mt-2 border-t border-line">
            <Row label="Total" value={formatRupiah(order.total)} bold />
          </div>
        </dl>
      </section>

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Batalkan Pesanan?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Tidak</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelMut.isPending}>Ya, Batalkan</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Pesanan <span className="font-semibold text-ink">{orderNumber}</span> akan dibatalkan dan stok produk dikembalikan. Tindakan ini tidak dapat diurungkan.
        </p>
      </Modal>
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="border border-line rounded-lg p-5">
      <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">
        <span className="text-ink">{icon}</span> {title}
      </div>
      {children}
    </div>
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
