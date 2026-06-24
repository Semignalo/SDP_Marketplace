import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, Tag, X, LogIn } from 'lucide-react'
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
import { Button, Card, Input, Textarea, Spinner } from '../components/ui'
import { Stepper, StepCard, CourierOption, Row, FALLBACK_COURIER_RATES } from '../components/checkout/shared'
import CitySearchInput from '../components/CitySearchInput'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah, cn } from '../lib/utils'
import { calcShippingCost, calcTierDiscount } from '../lib/pricing'

const STEPS = [
  { id: 1, title: 'Shipping' },
  { id: 2, title: 'Courier' },
  { id: 3, title: 'Review' },
]

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  city_id: null,
  country: 'Indonesia',
  postal_code: '',
}

function isInternational(form) {
  return !!form && (form.country || 'Indonesia').trim().toLowerCase() !== 'indonesia'
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
  const isIntl = isInternational(form)
  const finalTotal = isIntl ? subtotalAfterTier : total

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
        setReferralMsg(`Code from ${res.referrer_name}`)
      } else {
        setReferralStatus('invalid')
        setReferralMsg(res.message || 'Referral code not found')
      }
    } catch {
      setReferralStatus('invalid')
      setReferralMsg('Could not validate this code')
    }
  }

  const clearReferral = () => {
    setReferralCode('')
    setReferralStatus(null)
    setReferralMsg('')
  }

  const validateForm = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (isInternational(form)) {
      if (!form.city.trim()) e.city = 'City / state is required'
    } else if (!form.city_id) {
      e.city = 'Pick a city'
    }
    if (!form.address.trim()) e.address = 'Address details are required'
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
            rates: FALLBACK_COURIER_RATES,
            is_fallback: true,
          })
        },
      },
    )
  }

  const handleNext = () => {
    if (step === 1) {
      if (!validateForm()) {
        toast.error('Fill in your shipping details')
        return
      }
      if (referralCode.trim() && referralStatus === 'invalid') {
        toast.error('That referral code isn\'t valid. Clear it or fix it.')
        return
      }
      if (isIntl) {
        setStep(3)
        return
      }
      fetchShippingRates()
      setStep(2)
      return
    }
    if (step === 2) {
      if (!selectedCourier) {
        toast.error('Choose a courier first')
        return
      }
      setStep(3)
    }
  }

  const fullAddress = () =>
    [form.address, `${form.city}`, form.postal_code].filter(Boolean).join(', ').trim()

  const handleSubmit = async () => {
    if (!isIntl && !selectedCourier) {
      toast.error('Choose a courier first')
      return
    }
    // Don't send an invalid referral code
    const refToSend = referralCode.trim() && referralStatus !== 'invalid' ? referralCode.trim() : null

    try {
      const result = await createOrder.mutateAsync({
        guest_email: form.email.trim(),
        shipping_name: form.name.trim(),
        shipping_phone: form.phone.trim(),
        shipping_address: fullAddress(),
        shipping_country: form.country,
        ...(isIntl
          ? {}
          : {
              courier_name: `${selectedCourier.name} ${selectedCourier.service}`,
              shipping_cost: selectedCourier.cost || 0,
            }),
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

      if (isIntl) {
        toast.success("Order placed! We'll email your shipping quote soon.")
        navigate(trackUrl, { replace: true })
        return
      }

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
            toast.error('Payment failed. Finish it from your tracking page.')
            navigate(trackUrl, { replace: true })
          },
          onClose: () => navigate(trackUrl, { replace: true }),
        })
      } catch (payErr) {
        // Order already created — send them to tracking to retry payment
        toast.info('Order placed. Continue payment from the tracking page.')
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
          <p className="text-sm text-ink-muted">No account needed — just your shipping details.</p>
        </div>
        <Link to="/login?next=/checkout" className="shrink-0">
          <Button variant="ghost" size="sm" leadingIcon={<LogIn size={14} />}>Have an account? Sign in</Button>
        </Link>
      </div>

      <Stepper steps={STEPS} current={step} onJump={(s) => s < step && setStep(s)} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
        <div className="space-y-6">
          {step === 1 && (
            <>
              <StepCard title="Shipping Details">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Recipient name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                  <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="for confirmation & order tracking" error={errors.email} />
                  <Input label="Phone number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62..." error={errors.phone} />
                  <Input
                    label="Country *"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value, city_id: isInternational({ country: e.target.value }) ? null : form.city_id })}
                    error={errors.country}
                  />
                  {isInternational(form) ? (
                    <Input label="City / State *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
                  ) : (
                    <CitySearchInput value={form.city} cityId={form.city_id} onChange={({ name, id }) => setForm({ ...form, city: name, city_id: id })} error={errors.city} />
                  )}
                  <div className="sm:col-span-2">
                    <Input label="Address details *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, RT/RW, district, sub-district" error={errors.address} />
                  </div>
                  <Input label="Postal code (optional)" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} error={errors.postal_code} />
                </div>
              </StepCard>

              <StepCard title="Referral Code (optional)">
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
                        aria-label="Referral code"
                        placeholder="Enter a referral code"
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
                    Check
                  </Button>
                </div>
              </StepCard>
            </>
          )}

          {step === 2 && (
            <StepCard title="Choose a Courier">
              {shippingRatesMut.isPending ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <Spinner />
                  <p className="text-sm text-ink-muted">Calculating shipping...</p>
                </div>
              ) : (
                <>
                  {shippingRates?.is_fallback && (
                    <div className="mb-4 px-4 py-3 bg-state-warning/10 rounded text-xs text-state-warning">
                      Estimated shipping rates (live rate check is temporarily unavailable).
                    </div>
                  )}
                  {isFreeShipping && (
                    <div className="mb-4 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft shadow-card">
                      Free shipping is active — still pick a courier to ship your order.
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
              <StepCard title="Shipping" action={<button type="button" onClick={() => setStep(1)} className="text-xs text-ink-muted hover:text-ink">Change</button>}>
                <p className="text-sm font-semibold">{form.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{form.email} · {form.phone}</p>
                <p className="text-sm text-ink-soft mt-2">{fullAddress()}</p>
              </StepCard>

              <StepCard title="Courier" action={!isIntl && <button type="button" onClick={() => setStep(2)} className="text-xs text-ink-muted hover:text-ink">Change</button>}>
                {isIntl ? (
                  <p className="text-sm text-ink-muted">International shipping — to be quoted by our team after checkout.</p>
                ) : selectedCourier && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{selectedCourier.name} — {selectedCourier.service}</p>
                      <p className="text-xs text-ink-muted mt-0.5">Estimated {selectedCourier.eta}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {shippingCost === 0 ? <span className="text-state-success">FREE</span> : formatRupiah(shippingCost)}
                    </p>
                  </div>
                )}
              </StepCard>

              <StepCard title={`Items (${items.length})`}>
                <ul className="divide-y divide-line -my-2">
                  {items.map((item) => (
                    <li key={item.product_id} className="py-3 flex gap-3">
                      <div className="h-14 w-14 bg-paper-warm overflow-hidden rounded shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.name}</p>
                        <p className="text-2xs uppercase tracking-widest text-ink-muted mt-0.5">{item.vendor_name}</p>
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">{formatRupiah(item.price)} × {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </StepCard>

              <StepCard title="Notes (optional)">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="A note for the seller or courier"
                />
              </StepCard>
            </>
          )}

          <div className="flex justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(isIntl && step === 3 ? 1 : step - 1)}>← Back</Button>
            ) : (
              <Link to="/keranjang"><Button variant="ghost">← Cart</Button></Link>
            )}
            {step < 3 ? (
              <Button onClick={handleNext}>Continue →</Button>
            ) : (
              <Button variant="accent" onClick={handleSubmit} loading={createOrder.isPending || snapMut.isPending} leadingIcon={<ShieldCheck size={16} />}>
                Pay now
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padding="md">
            <h2 className="eyebrow mb-4">Summary</h2>
            <dl className="space-y-3 text-sm">
              <Row label={`Subtotal (${items.length} products)`} value={formatRupiah(subtotal)} />
              {guestTier && tierDiscount > 0 && (
                <Row
                  label={`${guestTier.name} tier discount (-${guestTier.discount}%)`}
                  value={<span className="text-state-success">-{formatRupiah(tierDiscount)}</span>}
                />
              )}
              <Row
                label="Shipping"
                value={isIntl
                  ? <span className="text-ink-muted text-xs">To be quoted</span>
                  : selectedCourier
                    ? (shippingCost === 0 ? <span className="text-state-success">FREE</span> : formatRupiah(shippingCost))
                    : <span className="text-ink-muted text-xs">Pick a courier</span>}
              />
              {referralStatus === 'valid' && (
                <Row label="Referral" value={<span className="text-state-success text-xs">{referralCode}</span>} />
              )}
              <div className="pt-3 border-t border-line">
                <Row label="Total" value={formatRupiah(finalTotal)} bold />
              </div>
            </dl>

            {step === 3 && (
              <p className="mt-4 pt-4 border-t border-line text-2xs text-ink-muted flex items-center gap-1.5">
                <ShieldCheck size={13} className="shrink-0" /> Payments are encrypted and secured via Midtrans
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}

