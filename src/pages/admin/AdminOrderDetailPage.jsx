import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminOrder, useUpdateAdminOrderStatus } from '../../hooks/useAdmin'
import { Badge, Button, Select, Textarea, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDateTime } from '../../lib/utils'

const STATUS_BADGE = {
  pending_payment: { label: 'Menunggu Bayar', variant: 'warning' },
  processing: { label: 'Diproses', variant: 'neutral' },
  shipped: { label: 'Dikirim', variant: 'info' },
  completed: { label: 'Selesai', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error } = useAdminOrder(orderNumber)
  const update = useUpdateAdminOrderStatus()

  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-40 w-full" /></div>
  }

  if (error || !order) {
    return <EmptyState title="Pesanan tidak ditemukan" action={<Link to="/admin/pesanan"><Button variant="outline">Kembali</Button></Link>} />
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
      toast.success('Status pesanan diperbarui')
      setStatus('')
      setNotes('')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/pesanan" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Kembali ke daftar pesanan
      </Link>

      <div className="bg-paper border border-line rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-muted">Nomor Pesanan</p>
            <p className="text-base font-semibold text-ink tabular-nums">{order.order_number}</p>
            <p className="text-xs text-ink-muted mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      {/* Status update */}
      <section className="bg-paper border border-line rounded-lg p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Update Status</h3>
        <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <Select label="Status Baru" value={currentStatus} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending_payment">Menunggu Bayar</option>
            <option value="processing">Diproses (verify payment)</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </Select>
          <Textarea label="Catatan Admin (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={order.admin_notes || 'Misal: verifikasi manual transfer BCA'} />
          <Button onClick={handleSave} loading={update.isPending}>Simpan</Button>
        </div>
        {order.payment_verified_at && (
          <p className="mt-3 text-xs text-state-success">✓ Payment diverifikasi: {formatDateTime(order.payment_verified_at)}</p>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <InfoCard icon={<User size={16} />} title="Customer">
          <p className="text-sm font-semibold">{order.customer?.name}</p>
          <p className="text-xs text-ink-muted">{order.customer?.email}</p>
          <p className="text-xs text-ink-muted">{order.customer?.phone}</p>
        </InfoCard>
        <InfoCard icon={<MapPin size={16} />} title="Alamat Pengiriman">
          <p className="text-sm font-semibold">{order.shipping_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{order.shipping_phone}</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">{order.shipping_address}</p>
        </InfoCard>
        <InfoCard icon={<Truck size={16} />} title="Pengiriman">
          <p className="text-sm">{order.shipping_courier || 'Belum dipilih'}</p>
          {order.tracking_number && <p className="text-xs text-ink-muted mt-1">Resi: <span className="text-ink tabular-nums">{order.tracking_number}</span></p>}
          {order.tracking_number && order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline mt-2"
            >
              Lacak di situs {order.shipping_courier} →
            </a>
          )}
        </InfoCard>
      </div>

      {order.reseller && (
        <InfoCard icon={<Wallet size={16} />} title="Reseller & Komisi">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold">{order.reseller.name}</p>
              <p className="text-2xs text-ink-muted tabular-nums">Code: {order.reseller.reseller_code}</p>
            </div>
            {order.commission && (
              <>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-muted">Komisi</p>
                  <p className="text-sm font-semibold tabular-nums">{formatRupiah(order.commission.amount)}</p>
                  <p className="text-2xs text-ink-muted tabular-nums">rate {order.commission.rate}%</p>
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-muted">Status Komisi</p>
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
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted px-5 py-3 border-b border-line bg-paper-soft">Item Pesanan</h3>
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
            <Row label={`Diskon Tier ${order.tier_name || ''}`} value={<span className="text-state-success">−{formatRupiah(order.tier_discount)}</span>} />
          )}
          <Row label="Ongkir" value={formatRupiah(order.shipping_cost)} />
          <div className="pt-2 mt-2 border-t border-line">
            <Row label="Total" value={formatRupiah(order.total)} bold />
          </div>
        </div>
      </section>

      {order.admin_notes && (
        <div className="bg-paper-soft border border-line rounded-lg p-4">
          <p className="text-2xs uppercase tracking-widest text-ink-muted mb-1">Catatan Admin</p>
          <p className="text-sm text-ink-soft">{order.admin_notes}</p>
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-paper border border-line rounded-lg p-5">
      <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">
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
