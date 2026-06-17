import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check, MapPin, Truck, ClipboardList, ShieldCheck, Tag, X, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '../stores/useCartStore'
import { useReferralStore } from '../stores/useReferralStore'
import { useCheckoutOptions } from '../hooks/useCheckout'
import {
  useGuestShippingRates,
  useCreateGuestOrder,
  useGuestSnapToken,
  useValidateReferral,
} from '../hooks/useGuestCheckout'
import { saveGuestToken } from '../lib/guestOrders'
import { loadSnap } from '../lib/snap'
import { Button, Input, Spinner } from '../components/ui'
import CitySearchInput from '../components/CitySearchInput'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah, cn } from '../lib/utils'
import { calcShippingCost, calcTierDiscount } from '../lib/pricing'

const STEPS = [
  { id: 1, title: 'Pengiriman', icon: MapPin },
  { id: 2, title: 'Kurir', icon: Truck },
  { id: 3, title: 'Review', icon: ClipboardList },
]

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  city_id: null,
  postal_code: '',
}

export default function GuestCheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const clearCart = useCartStore((s) => s.clear)
  const getActiveReferral = useReferralStore((s) => s.getActive)

  const { data: options } = useCheckoutOptions()
  const shippingRatesMut = useGuestShippingRates()
  const createOrder = useCreateGuestOrder()
  const snapMut = useGuestSnapToken()
  const validateReferral = useValidateReferral()

  const orderPlacedRef = useRef(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [notes, setNotes] = useState('')
  const [shippingRates, setShippingRates] = useState(null)

  // Referral
  const [referralCode, setReferralCode] = useState('')
  const [referralStatus, setReferralStatus] = useState(null) // null | 'valid' | 'invalid'
  const [referralMsg, setReferralMsg] = useState('')

  // Auto-fill kode referral dari session (link / capture sebelumnya)
  useEffect(() => {
    const active = getActiveReferral()
    if (active) {
      setReferralCode(active)
      checkReferral(active)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (items.length === 0 && !orderPlacedRef.current) return <Navigate to="/keranjang" replace />

  const freeShippingMin = Number(options?.shipping_min_free || 150000)
  const freeShippingMax = Number(options?.shipping_max_free || 20000)
  const guestTier = options?.guest_tier || null
  const tierMaxDiscount = Number(options?.tier_max_discount_rupiah || 0)

  const tierDiscount = calcTierDiscount(subtotal, guestTier, tierMaxDiscount)
  const subtotalAfterTier = subtotal - tierDiscount
  const isFreeShipping = subtotalAfterTier >= freeShippingMin
  const courierCost = Number(selectedCourier?.cost || 0)
  const shippingCost = calcShippingCost(courierCost, subtotalAfterTier, freeShippingMin, freeShippingMax)
  const total = subtotalAfterTier + shippingCost

  const checkReferral = async (code) => {
    const c = (code || '').trim()
    if (!c) {
      setReferralStatus(null)
      setReferralMsg('')
      return
    }
    try {
      const res = await validateReferral.mutateAsync(c)
      if (res.valid) {
        setReferralStatus('valid')
        setReferralMsg(`Kode dari ${res.referrer_name}`)
      } else {
        setReferralStatus('invalid')
        setReferralMsg(res.message || 'Kode referral tidak ditemukan')
      }
    } catch {
      setReferralStatus('invalid')
      setReferralMsg('Gagal memvalidasi kode')
    }
  }

  const clearReferral = () => {
    setReferralCode('')
    setReferralStatus(null)
    setReferralMsg('')
  }

  const validateForm = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi'
    if (!form.city_id) e.city = 'Pilih kota/kabupaten'
    if (!form.address.trim()) e.address = 'Detail alamat wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const fetchShippingRates = () => {
    setShippingRates(null)
    setSelectedCourier(null)
    shippingRatesMut.mutate(
      {
        city_id: form.city_id,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      },
      {
        onSuccess: (data) => setShippingRates(data),
        onError: () => {
          setShippingRates({
            rates: [
              { code: 'jne_reg', name: 'JNE', service: 'REG', cost: 18000, eta: '2-3 hari' },
              { code: 'jnt_ez', name: 'J&T', service: 'EZ', cost: 16000, eta: '2-3 hari' },
              { code: 'pos_kilat', name: 'POS', service: 'Kilat', cost: 12000, eta: '3-5 hari' },
            ],
            is_fallback: true,
          })
        },
      },
    )
  }

  const handleNext = () => {
    if (step === 1) {
      if (!validateForm()) {
        toast.error('Lengkapi data pengiriman')
        return
      }
      if (referralCode.trim() && referralStatus === 'invalid') {
        toast.error('Kode referral tidak valid. Kosongkan atau perbaiki.')
        return
      }
      fetchShippingRates()
      setStep(2)
      return
    }
    if (step === 2) {
      if (!selectedCourier) {
        toast.error('Pilih kurir dulu')
        return
      }
      setStep(3)
    }
  }

  const fullAddress = () =>
    [form.address, `${form.city}`, form.postal_code].filter(Boolean).join(', ').trim()

  const handleSubmit = async () => {
    if (!selectedCourier) {
      toast.error('Pilih kurir dulu')
      return
    }
    // Jangan kirim kode referral yang invalid
    const refToSend = referralCode.trim() && referralStatus !== 'invalid' ? referralCode.trim() : null

    try {
      const result = await createOrder.mutateAsync({
        guest_email: form.email.trim(),
        shipping_name: form.name.trim(),
        shipping_phone: form.phone.trim(),
        shipping_address: fullAddress(),
        courier_name: `${selectedCourier.name} ${selectedCourier.service}`,
        shipping_cost: selectedCourier.cost || 0,
        referral_code: refToSend,
        notes,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      })

      const order = result.data
      const token = result.guest_token
      orderPlacedRef.current = true
      saveGuestToken(order.order_number, token)
      clearCart()

      const trackUrl = `/lacak/${order.order_number}?token=${encodeURIComponent(token)}`

      try {
        const { token: snapToken, client_key, is_production } = await snapMut.mutateAsync({
          orderNumber: order.order_number,
          token,
        })
        const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
        snap.pay(snapToken, {
          onSuccess: () => navigate(`${trackUrl}&paid=1`, { replace: true }),
          onPending: () => navigate(trackUrl, { replace: true }),
          onError: () => {
            toast.error('Pembayaran gagal. Selesaikan dari halaman lacak pesanan.')
            navigate(trackUrl, { replace: true })
          },
          onClose: () => navigate(trackUrl, { replace: true }),
        })
      } catch (payErr) {
        // Order sudah dibuat — arahkan ke tracking untuk bayar ulang
        toast.info('Pesanan dibuat. Lanjutkan pembayaran di halaman lacak.')
        navigate(trackUrl, { replace: true })
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mb-1">Checkout</h1>
          <p className="text-sm text-ink-muted">Belanja tanpa akun — cukup isi data pengiriman</p>
        </div>
        <Link to="/login?next=/checkout" className="shrink-0">
          <Button variant="ghost" size="sm" leadingIcon={<LogIn size={14} />}>Punya akun? Masuk</Button>
        </Link>
      </div>

      <Stepper current={step} onJump={(s) => s < step && setStep(s)} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
        <div className="space-y-6">
          {step === 1 && (
            <>
              <StepCard title="Data Pengiriman">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Nama Penerima *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                  <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="untuk konfirmasi & lacak pesanan" error={errors.email} />
                  <Input label="Nomor HP *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62..." error={errors.phone} />
                  <CitySearchInput value={form.city} cityId={form.city_id} onChange={({ name, id }) => setForm({ ...form, city: name, city_id: id })} error={errors.city} />
                  <div className="sm:col-span-2">
                    <Input label="Detail Alamat *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jalan, RT/RW, kelurahan, kecamatan" error={errors.address} />
                  </div>
                  <Input label="Kode Pos (opsional)" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} error={errors.postal_code} />
                </div>
              </StepCard>

              <StepCard title="Kode Referral (opsional)">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toUpperCase())
                          setReferralStatus(null)
                          setReferralMsg('')
                        }}
                        onBlur={() => checkReferral(referralCode)}
                        placeholder="Masukkan kode referral"
                        className={cn(
                          'w-full pl-9 pr-9 py-2.5 text-sm border rounded focus:outline-none focus:ring-2 uppercase tracking-wide',
                          referralStatus === 'valid' && 'border-state-success focus:ring-state-success/30',
                          referralStatus === 'invalid' && 'border-state-danger focus:ring-state-danger/30',
                          !referralStatus && 'border-line focus:ring-ink focus:border-ink',
                        )}
                      />
                      {referralCode && (
                        <button type="button" onClick={clearReferral} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {referralMsg && (
                      <p className={cn('text-xs mt-1.5', referralStatus === 'valid' ? 'text-state-success' : 'text-state-danger')}>
                        {referralMsg}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => checkReferral(referralCode)} loading={validateReferral.isPending} disabled={!referralCode.trim()}>
                    Cek
                  </Button>
                </div>
              </StepCard>
            </>
          )}

          {step === 2 && (
            <StepCard title="Pilih Kurir">
              {shippingRatesMut.isPending ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <Spinner />
                  <p className="text-sm text-ink-muted">Menghitung ongkir...</p>
                </div>
              ) : (
                <>
                  {shippingRates?.is_fallback && (
                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      Tarif ongkir estimasi (layanan cek ongkir sedang tidak tersedia).
                    </div>
                  )}
                  {isFreeShipping && (
                    <div className="mb-4 px-4 py-3 bg-paper-soft border border-line rounded text-xs text-ink-soft">
                      Gratis ongkir aktif — kurir tetap perlu dipilih untuk pengiriman.
                    </div>
                  )}
                  <div className="space-y-2">
                    {(shippingRates?.rates || []).map((c) => (
                      <CourierOption
                        key={c.code}
                        courier={c}
                        selected={selectedCourier?.code === c.code}
                        freeShipping={isFreeShipping}
                        freeMax={freeShippingMax}
                        onSelect={() => setSelectedCourier(c)}
                      />
                    ))}
                  </div>
                </>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <>
              <StepCard title="Pengiriman" action={<button onClick={() => setStep(1)} className="text-xs text-ink-muted hover:text-ink">Ubah</button>}>
                <p className="text-sm font-semibold">{form.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{form.email} · {form.phone}</p>
                <p className="text-sm text-ink-soft mt-2">{fullAddress()}</p>
              </StepCard>

              <StepCard title="Kurir" action={<button onClick={() => setStep(2)} className="text-xs text-ink-muted hover:text-ink">Ubah</button>}>
                {selectedCourier && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{selectedCourier.name} — {selectedCourier.service}</p>
                      <p className="text-xs text-ink-muted mt-0.5">Estimasi {selectedCourier.eta}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {shippingCost === 0 ? <span className="text-state-success">GRATIS</span> : formatRupiah(shippingCost)}
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
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">{formatRupiah(item.price)} × {item.quantity}</p>
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
              <Button onClick={handleNext}>Lanjutkan →</Button>
            ) : (
              <Button variant="accent" onClick={handleSubmit} loading={createOrder.isPending || snapMut.isPending} leadingIcon={<ShieldCheck size={16} />}>
                Bayar Sekarang
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line rounded-lg p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Ringkasan</h2>
            <dl className="space-y-3 text-sm">
              <Row label={`Subtotal (${items.length} produk)`} value={formatRupiah(subtotal)} />
              {guestTier && tierDiscount > 0 && (
                <Row
                  label={`Diskon Tier ${guestTier.name} (-${guestTier.discount}%)`}
                  value={<span className="text-state-success">-{formatRupiah(tierDiscount)}</span>}
                />
              )}
              <Row
                label="Ongkir"
                value={selectedCourier
                  ? (shippingCost === 0 ? <span className="text-state-success">GRATIS</span> : formatRupiah(shippingCost))
                  : <span className="text-ink-muted text-xs">Pilih kurir</span>}
              />
              {referralStatus === 'valid' && (
                <Row label="Referral" value={<span className="text-state-success text-xs">{referralCode}</span>} />
              )}
              <div className="pt-3 border-t border-line">
                <Row label="Total" value={formatRupiah(total)} bold />
              </div>
            </dl>

            {step === 3 && (
              <p className="mt-4 pt-4 border-t border-line text-2xs text-ink-muted flex items-center gap-1.5">
                <ShieldCheck size={13} className="shrink-0" /> Pembayaran aman terenkripsi via Midtrans
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stepper({ current, onJump }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, idx) => {
        const active = s.id === current
        const done = s.id < current
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => onJump?.(s.id)}
              className={cn(
                'flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-1 px-1 sm:px-3 py-2 rounded transition',
                done && 'text-ink hover:bg-paper-warm cursor-pointer',
                active && 'bg-ink text-white',
                !done && !active && 'text-ink-faint cursor-default',
              )}
            >
              <span className={cn(
                'h-7 w-7 inline-flex items-center justify-center rounded-pill text-xs font-bold border shrink-0',
                done && 'bg-ink text-white border-ink',
                active && 'bg-white text-ink border-white',
                !done && !active && 'border-line text-ink-faint',
              )}>
                {done ? <Check size={14} /> : s.id}
              </span>
              <span className="text-2xs sm:text-sm font-semibold text-center">{s.title}</span>
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

function CourierOption({ courier, selected, freeShipping, freeMax, onSelect }) {
  const afterSubsidy = freeShipping ? Math.max(0, courier.cost - freeMax) : courier.cost
  const isFullyFree = freeShipping && afterSubsidy === 0
  return (
    <label className={cn('flex items-center gap-3 p-4 border rounded cursor-pointer transition', selected ? 'border-ink bg-paper-soft' : 'border-line hover:border-line-strong')}>
      <input type="radio" name="courier" checked={selected} onChange={onSelect} className="h-4 w-4 accent-ink" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{courier.name} — {courier.service}</p>
          <div className="text-right">
            {isFullyFree
              ? <span className="text-sm font-semibold text-state-success">GRATIS</span>
              : <span className="text-sm font-semibold tabular-nums">{formatRupiah(afterSubsidy)}</span>}
            {freeShipping && !isFullyFree && <p className="text-2xs text-ink-faint line-through">{formatRupiah(courier.cost)}</p>}
          </div>
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
