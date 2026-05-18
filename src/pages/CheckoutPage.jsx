import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check, MapPin, Truck, ClipboardList, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useAddresses, useSaveAddress } from '../hooks/useAccount'
import { useCheckoutOptions, useCreateOrder } from '../hooks/useCheckout'
import { Button, Input, Spinner, Modal } from '../components/ui'
import TierBadge from '../components/TierBadge'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah, cn } from '../lib/utils'

const STEPS = [
  { id: 1, title: 'Alamat', icon: MapPin },
  { id: 2, title: 'Pengiriman', icon: Truck },
  { id: 3, title: 'Review', icon: ClipboardList },
]

const EMPTY_ADDR = {
  label: 'Rumah',
  recipient_name: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  is_default: true,
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const clearCart = useCartStore((s) => s.clear)

  const { data: addresses = [], isLoading: addrLoading } = useAddresses()
  const { data: options, isLoading: optLoading } = useCheckoutOptions()
  const createOrder = useCreateOrder()
  const saveAddress = useSaveAddress()

  const orderPlacedRef = useRef(false)
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [selectedCourier, setSelectedCourier] = useState('')
  const [notes, setNotes] = useState('')
  const [addrModalOpen, setAddrModalOpen] = useState(false)
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR)
  const [addrErrors, setAddrErrors] = useState({})

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(def.id)
    }
  }, [addresses, selectedAddressId])

  if (isReady && !user) return <Navigate to="/login?next=/checkout" replace />
  if (items.length === 0 && !orderPlacedRef.current) return <Navigate to="/keranjang" replace />

  const couriers = options?.couriers || []
  const freeShippingMin = Number(options?.shipping_min_free || 150000)

  // Apply tier discount preview (sync with backend logic)
  const tier = user?.tier || null
  const tierDiscountPct = Number(tier?.discount || 0)
  const tierDiscount = Math.round(subtotal * tierDiscountPct / 100)
  const subtotalAfterTier = subtotal - tierDiscount

  const isFreeShipping = subtotalAfterTier >= freeShippingMin
  const courier = couriers.find((c) => c.code === selectedCourier)
  const shippingCost = isFreeShipping ? 0 : Number(courier?.cost || 0)
  const total = subtotalAfterTier + shippingCost
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  const canNext = (s) => {
    if (s === 1) return !!selectedAddressId
    if (s === 2) return !!selectedCourier
    return true
  }

  const handleNext = () => {
    if (!canNext(step)) {
      toast.error(step === 1 ? 'Pilih alamat pengiriman dulu' : 'Pilih kurir dulu')
      return
    }
    setStep(Math.min(3, step + 1))
  }

  const handleSubmit = async () => {
    if (!selectedAddressId || !selectedCourier) {
      toast.error('Lengkapi alamat & kurir')
      return
    }
    try {
      const order = await createOrder.mutateAsync({
        address_id: selectedAddressId,
        courier: selectedCourier,
        notes,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      })
      orderPlacedRef.current = true
      navigate(`/order/sukses/${order.order_number}`, { replace: true })
      clearCart()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setAddrErrors({})
    try {
      const saved = await saveAddress.mutateAsync(addrForm)
      toast.success('Alamat ditambahkan')
      setAddrModalOpen(false)
      setAddrForm(EMPTY_ADDR)
      setSelectedAddressId(saved.id)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const e = {}
        Object.entries(apiErrors).forEach(([k, v]) => (e[k] = Array.isArray(v) ? v[0] : v))
        setAddrErrors(e)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mb-1">Checkout</h1>
      <p className="text-sm text-ink-muted mb-8">Selesaikan pesananmu</p>

      <Stepper current={step} onJump={(s) => s < step && setStep(s)} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
        <div className="space-y-6">
          {step === 1 && (
            <StepCard title="Alamat Pengiriman">
              {addrLoading ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : addresses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-ink-muted mb-4">Belum ada alamat tersimpan.</p>
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setAddrModalOpen(true)}>
                    Tambah Alamat
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <AddressOption
                        key={addr.id}
                        addr={addr}
                        selected={selectedAddressId === addr.id}
                        onSelect={() => setSelectedAddressId(addr.id)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddrModalOpen(true)}
                    className="mt-4 w-full border border-dashed border-line rounded-lg py-3 text-sm text-ink-muted hover:text-ink hover:border-line-strong inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Tambah Alamat Baru
                  </button>
                </>
              )}
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="Pilih Kurir">
              {optLoading ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : (
                <>
                  {isFreeShipping && (
                    <div className="mb-4 px-4 py-3 bg-paper-soft border border-line rounded text-xs text-ink-soft">
                      Gratis ongkir aktif — kurir tetap perlu dipilih untuk pengiriman.
                    </div>
                  )}
                  <div className="space-y-2">
                    {couriers.map((c) => (
                      <CourierOption
                        key={c.code}
                        courier={c}
                        selected={selectedCourier === c.code}
                        free={isFreeShipping}
                        onSelect={() => setSelectedCourier(c.code)}
                      />
                    ))}
                  </div>
                </>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <>
              <StepCard title="Alamat" action={<button onClick={() => setStep(1)} className="text-xs text-ink-muted hover:text-ink">Ubah</button>}>
                {selectedAddress && (
                  <div>
                    <p className="text-sm font-semibold">{selectedAddress.recipient_name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{selectedAddress.phone}</p>
                    <p className="text-sm text-ink-soft mt-2">{selectedAddress.address}, {selectedAddress.city} {selectedAddress.postal_code}</p>
                  </div>
                )}
              </StepCard>

              <StepCard title="Kurir" action={<button onClick={() => setStep(2)} className="text-xs text-ink-muted hover:text-ink">Ubah</button>}>
                {courier && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{courier.name} — {courier.service}</p>
                      <p className="text-xs text-ink-muted mt-0.5">Estimasi {courier.eta}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {isFreeShipping ? <span className="text-state-success">GRATIS</span> : formatRupiah(courier.cost)}
                    </p>
                  </div>
                )}
              </StepCard>

              <StepCard title={`Item (${items.length})`}>
                <ul className="divide-y divide-line -my-2">
                  {items.map((item) => (
                    <li key={item.product_id} className="py-3 flex gap-3">
                      <div className="h-14 w-14 bg-paper-warm overflow-hidden rounded shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.name}</p>
                        <p className="text-2xs uppercase tracking-widest text-ink-faint mt-0.5">{item.vendor_name}</p>
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                          {formatRupiah(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </StepCard>

              <StepCard title="Catatan (opsional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Catatan untuk penjual atau kurir"
                  className="w-full px-3 py-2.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink resize-none"
                />
              </StepCard>
            </>
          )}

          <div className="flex justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>← Kembali</Button>
            ) : (
              <Link to="/keranjang"><Button variant="ghost">← Keranjang</Button></Link>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext(step)}>Lanjutkan →</Button>
            ) : (
              <Button onClick={handleSubmit} loading={createOrder.isPending} leadingIcon={<ShieldCheck size={16} />}>
                Bayar Sekarang
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line rounded-lg p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Ringkasan</h2>
            {tier && (
              <div className="mb-4 pb-4 border-b border-line flex items-center gap-2">
                <TierBadge tier={tier} size="sm" />
                <span className="text-2xs text-ink-muted">diskon {tier.discount}% diterapkan</span>
              </div>
            )}
            <dl className="space-y-3 text-sm">
              <Row label={`Subtotal (${items.length} produk)`} value={formatRupiah(subtotal)} />
              {tier && tierDiscount > 0 && (
                <Row
                  label={`Diskon ${tier.name} (-${tier.discount}%)`}
                  value={<span className="text-state-success">−{formatRupiah(tierDiscount)}</span>}
                />
              )}
              <Row
                label="Ongkir"
                value={courier
                  ? (isFreeShipping ? <span className="text-state-success">GRATIS</span> : formatRupiah(shippingCost))
                  : <span className="text-ink-muted text-xs">Pilih kurir</span>}
              />
              <div className="pt-3 border-t border-line">
                <Row label="Total" value={formatRupiah(total)} bold />
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <Modal
        open={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        title="Tambah Alamat Baru"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddrModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveAddress} loading={saveAddress.isPending}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAddress} className="grid sm:grid-cols-2 gap-4">
          <Input label="Label" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} placeholder="Rumah/Kantor" error={addrErrors.label} />
          <Input label="Nama Penerima" value={addrForm.recipient_name} onChange={(e) => setAddrForm({ ...addrForm, recipient_name: e.target.value })} error={addrErrors.recipient_name} />
          <Input label="Nomor HP" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="+62..." error={addrErrors.phone} />
          <Input label="Kota" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} error={addrErrors.city} />
          <div className="sm:col-span-2">
            <Input label="Alamat Lengkap" value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="Jalan, RT/RW, kelurahan, kecamatan" error={addrErrors.address} />
          </div>
          <Input label="Kode Pos" value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} error={addrErrors.postal_code} />
        </form>
      </Modal>
    </div>
  )
}

function Stepper({ current, onJump }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, idx) => {
        const Icon = s.icon
        const active = s.id === current
        const done = s.id < current
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => onJump?.(s.id)}
              className={cn(
                'flex items-center gap-2 flex-1 px-3 py-2 rounded transition',
                done && 'text-ink hover:bg-paper-warm cursor-pointer',
                active && 'bg-ink text-white',
                !done && !active && 'text-ink-faint cursor-default',
              )}
            >
              <span className={cn(
                'h-7 w-7 inline-flex items-center justify-center rounded-pill text-xs font-bold border',
                done && 'bg-ink text-white border-ink',
                active && 'bg-white text-ink border-white',
                !done && !active && 'border-line text-ink-faint',
              )}>
                {done ? <Check size={14} /> : s.id}
              </span>
              <span className="text-sm font-semibold hidden sm:inline">{s.title}</span>
            </button>
            {idx < STEPS.length - 1 && <span className="h-px w-4 bg-line hidden md:block" />}
          </div>
        )
      })}
    </div>
  )
}

function StepCard({ title, action, children }) {
  return (
    <section className="border border-line rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function AddressOption({ addr, selected, onSelect }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-4 border rounded cursor-pointer transition',
        selected ? 'border-ink bg-paper-soft' : 'border-line hover:border-line-strong',
      )}
    >
      <input
        type="radio"
        name="address"
        checked={selected}
        onChange={onSelect}
        className="mt-1 h-4 w-4 accent-ink"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">{addr.label}</span>
          {addr.is_default && <span className="text-2xs px-1.5 py-0.5 bg-ink text-white rounded">Utama</span>}
        </div>
        <p className="text-sm font-semibold text-ink">{addr.recipient_name}</p>
        <p className="text-xs text-ink-muted mt-0.5">{addr.phone}</p>
        <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
          {addr.address}, {addr.city} {addr.postal_code}
        </p>
      </div>
    </label>
  )
}

function CourierOption({ courier, selected, free, onSelect }) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 p-4 border rounded cursor-pointer transition',
        selected ? 'border-ink bg-paper-soft' : 'border-line hover:border-line-strong',
      )}
    >
      <input
        type="radio"
        name="courier"
        checked={selected}
        onChange={onSelect}
        className="h-4 w-4 accent-ink"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{courier.name} — {courier.service}</p>
          <p className="text-sm font-semibold tabular-nums">
            {free ? <span className="text-state-success">GRATIS</span> : formatRupiah(courier.cost)}
          </p>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">Estimasi {courier.eta}</p>
      </div>
    </label>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={bold ? 'text-sm font-semibold' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={cn('tabular-nums', bold ? 'text-lg font-bold' : 'text-sm text-ink')}>{value}</dd>
    </div>
  )
}
