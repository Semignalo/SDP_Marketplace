import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck } from 'lucide-react'
import { useOrder } from '../../hooks/useAccount'
import { Badge, Skeleton, EmptyState, Button } from '../../components/ui'
import { formatRupiah, formatDateTime } from '../../lib/utils'

const STATUS = {
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning' },
  processing: { label: 'Diproses', variant: 'neutral' },
  shipped: { label: 'Dikirim', variant: 'neutral' },
  completed: { label: 'Selesai', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error } = useOrder(orderNumber)

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

  return (
    <div className="space-y-6">
      <Link to="/akun/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Kembali
      </Link>

      <div className="border border-line rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-faint">Nomor Pesanan</p>
            <p className="text-base font-semibold text-ink tabular-nums">{order.order_number}</p>
            <p className="text-xs text-ink-muted mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <InfoCard icon={<MapPin size={16} />} title="Alamat Pengiriman">
          <p className="text-sm font-semibold">{order.shipping_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>
        <InfoCard icon={<Truck size={16} />} title="Pengiriman">
          <p className="text-sm">
            {order.shipping_courier || 'Kurir belum dipilih'}
          </p>
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
