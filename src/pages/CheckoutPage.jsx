import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useAddresses, useSaveAddress } from '../hooks/useAccount'
import { useCheckoutOptions, useCreateOrder, useSnapToken, useShippingRates } from '../hooks/useCheckout'
import { loadSnap } from '../lib/snap'
import { Button, Card, Input, Textarea, Spinner, Modal } from '../components/ui'
import { Stepper, StepCard, Row } from '../components/checkout/shared'
import TierBadge from '../components/TierBadge'
import CitySearchInput from '../components/CitySearchInput'
import { extractErrorMessage } from '../lib/api'
import { cn } from '../lib/utils'
import { useFormatPrice } from '../hooks/useCurrency'
import { calcTierDiscount, calcShippingCost } from '../lib/pricing'

const STEPS = [
  { id: 1, title: 'Address' },
  { id: 2, title: 'Shipping' },
  { id: 3, title: 'Review' },
]

const EMPTY_ADDR = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address: '',
  city: '',
  city_id: null,
  province: '',
  country: 'Indonesia',
  postal_code: '',
  is_default: true,
}

function isInternational(addr) {
  return !!addr && (addr.country || 'Indonesia').trim().toLowerCase() !== 'indonesia'
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const clearCart = useCartStore((s) => s.clear)

  const { data: addresses = [], isLoading: addrLoading } = useAddresses()
  const { data: options } = useCheckoutOptions()
  const createOrder = useCreateOrder()
  const snapMut = useSnapToken()
  const saveAddress = useSaveAddress()
  const shippingRatesMut = useShippingRates()

  const orderPlacedRef = useRef(false)
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [notes, setNotes] = useState('')
  const [addrModalOpen, setAddrModalOpen] = useState(false)
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR)
  const [addrErrors, setAddrErrors] = useState({})
  const [shippingQuote, setShippingQuote] = useState(null) // null = belum dimuat
  const formatPrice = useFormatPrice()

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(def.id)
    }
  }, [addresses, selectedAddressId])

  if (isReady && !user) return <Navigate to="/login?next=/checkout" replace />
  if (items.length === 0 && !orderPlacedRef.current) return <Navigate to="/keranjang" replace />

  const freeShippingMin = Number(options?.shipping_min_free || 150000)
  const freeShippingMax = Number(options?.shipping_max_free || 20000)

  // Apply tier discount preview (sync with backend logic)
  const tier = user?.tier || null
  const tierMaxDiscount = Number(options?.tier_max_discount_rupiah || 0)
  const tierDiscount = calcTierDiscount(subtotal, tier, tierMaxDiscount)
  const subtotalAfterTier = subtotal - tierDiscount

  const isFreeShipping = subtotalAfterTier >= freeShippingMin
  const requiresManual = !!shippingQuote?.requires_manual
  const flatCost = Number(shippingQuote?.cost || 0)
  // Jika free shipping aktif, subsidi max freeShippingMax — sisa ditanggung customer
  const shippingCost = requiresManual ? 0 : calcShippingCost(flatCost, subtotalAfterTier, freeShippingMin, freeShippingMax)
  const total = subtotalAfterTier + shippingCost
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  const isIntl = isInternational(selectedAddress)
  const finalTotal = (isIntl || requiresManual) ? subtotalAfterTier : total

  const canNext = (s) => {
    if (s === 1) return !!selectedAddressId
    if (s === 2) return isIntl || !!shippingQuote
    return true
  }

  const fetchShippingQuote = (addressId) => {
    setShippingQuote(null)
    shippingRatesMut.mutate(
      {
        address_id: addressId,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      },
      {
        onSuccess: (data) => setShippingQuote(data),
        onError: () => toast.error('Could not calculate shipping. Try again.'),
      }
    )
  }

  const handleNext = () => {
    if (!canNext(step)) {
      toast.error(step === 1 ? 'Pick a shipping address first' : 'Please wait for the shipping fee to load')
      return
    }
    const nextStep = Math.min(3, step + 1)
    if (nextStep === 2 && selectedAddressId && !isIntl) {
      fetchShippingQuote(selectedAddressId)
    }
    setStep(nextStep)
  }

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      toast.error('Add your address first')
      return
    }
    try {
      const order = await createOrder.mutateAsync({
        address_id: selectedAddressId,
        notes,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      })
      orderPlacedRef.current = true
      clearCart()

      if (order.status === 'awaiting_quote') {
        toast.success("Order placed! We'll email your shipping quote soon.")
        navigate(`/akun/pesanan/${order.order_number}`, { replace: true })
        return
      }

      const { token, client_key, is_production } = await snapMut.mutateAsync(order.order_number)
      const snap = await loadSnap({ clientKey: client_key, isProduction: is_production })
      snap.pay(token, {
        onSuccess: () => navigate(`/order/sukses/${order.order_number}?paid=1`, { replace: true }),
        onPending: () => navigate(`/akun/pesanan/${order.order_number}`, { replace: true }),
        onError: () => {
          toast.error('Payment failed. Finish it from your order page.')
          navigate(`/akun/pesanan/${order.order_number}`, { replace: true })
        },
        onClose: () => navigate(`/akun/pesanan/${order.order_number}`, { replace: true }),
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setAddrErrors({})
    try {
      const saved = await saveAddress.mutateAsync(addrForm)
      toast.success('Address added')
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
      <p className="text-sm text-ink-muted mb-8">Let's get this to you.</p>

      <Stepper steps={STEPS} current={step} onJump={(s) => s < step && setStep(s)} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
        <div className="space-y-6">
          {step === 1 && (
            <StepCard title="Shipping Address">
              {addrLoading ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : addresses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-ink-muted mb-4">No saved addresses yet.</p>
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setAddrModalOpen(true)}>
                    Add address
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
                    <Plus size={14} /> Add a new address
                  </button>
                </>
              )}
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="Shipping Fee">
              {isIntl ? (
                <div className="px-4 py-3 bg-state-warning/10 rounded text-xs text-state-warning">
                  This is an international address — automatic shipping rates aren't available. We'll calculate your shipping manually and email you a quote before payment is required.
                </div>
              ) : shippingRatesMut.isPending ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <Spinner />
                  <p className="text-sm text-ink-muted">Calculating shipping...</p>
                </div>
              ) : requiresManual ? (
                <div className="px-4 py-3 bg-state-warning/10 rounded text-xs text-state-warning">
                  Your area needs manual shipping coordination. We'll contact you and email a quote before payment is required.
                </div>
              ) : (
                <>
                  {isFreeShipping && (
                    <div className="mb-4 px-4 py-3 bg-paper-soft rounded text-xs text-ink-soft shadow-card">
                      Free shipping is active for this order.
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-line bg-paper-soft">
                    <div>
                      <p className="text-sm font-semibold text-ink">{shippingQuote?.zone_label || 'Flat shipping rate'}</p>
                      <p className="text-xs text-ink-muted mt-0.5">Courier assigned by our team after checkout</p>
                    </div>
                    <div className="text-right">
                      {shippingCost === 0
                        ? <span className="text-sm font-semibold text-state-success">FREE</span>
                        : <span className="text-sm font-semibold tabular-nums">{formatPrice(shippingCost)}</span>}
                      {isFreeShipping && shippingCost > 0 && (
                        <p className="text-2xs text-ink-faint line-through">{formatPrice(flatCost)}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <>
              <StepCard title="Address" action={<button type="button" onClick={() => setStep(1)} className="text-xs text-ink-muted hover:text-ink">Change</button>}>
                {selectedAddress && (
                  <div>
                    <p className="text-sm font-semibold">{selectedAddress.recipient_name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{selectedAddress.phone}</p>
                    <p className="text-sm text-ink-soft mt-2">{selectedAddress.address}, {selectedAddress.city} {selectedAddress.postal_code}</p>
                  </div>
                )}
              </StepCard>

              <StepCard title="Shipping Fee" action={<button type="button" onClick={() => setStep(2)} className="text-xs text-ink-muted hover:text-ink">Change</button>}>
                {isIntl || requiresManual ? (
                  <p className="text-sm text-ink-muted">To be quoted by our team after checkout.</p>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{shippingQuote?.zone_label}</p>
                      <p className="text-xs text-ink-muted mt-0.5">Courier assigned by our team</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {shippingCost === 0
                        ? <span className="text-state-success">FREE</span>
                        : formatPrice(shippingCost)}
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
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
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
              <Button variant="outline" onClick={() => setStep(step - 1)}>← Back</Button>
            ) : (
              <Link to="/keranjang"><Button variant="ghost">← Cart</Button></Link>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext(step)}>Continue →</Button>
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
            {tier && (
              <div className="mb-4 pb-4 border-b border-line flex items-center gap-2">
                <TierBadge tier={tier} size="sm" />
                <span className="text-2xs text-ink-muted">{tier.discount}% discount applied</span>
              </div>
            )}
            <dl className="space-y-3 text-sm">
              <Row label={`Subtotal (${items.length} products)`} value={formatPrice(subtotal)} />
              {tier && tierDiscount > 0 && (
                <Row
                  label={`${tier.name} discount (-${tier.discount}%)`}
                  value={<span className="text-state-success">−{formatPrice(tierDiscount)}</span>}
                />
              )}
              <Row
                label="Shipping"
                value={isIntl || requiresManual
                  ? <span className="text-ink-muted text-xs">To be quoted</span>
                  : shippingQuote
                    ? (shippingCost === 0
                        ? <span className="text-state-success">FREE</span>
                        : formatPrice(shippingCost))
                    : <span className="text-ink-muted text-xs">Calculating...</span>}
              />
              <div className="pt-3 border-t border-line">
                <Row label="Total" value={formatPrice(finalTotal)} bold />
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

      <Modal
        open={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        title="Add a New Address"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddrModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} loading={saveAddress.isPending}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAddress} className="grid sm:grid-cols-2 gap-4">
          <Input label="Label" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} placeholder="Home/Office" error={addrErrors.label} />
          <Input label="Recipient name *" value={addrForm.recipient_name} onChange={(e) => setAddrForm({ ...addrForm, recipient_name: e.target.value })} error={addrErrors.recipient_name} />
          <Input label="Phone number *" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="+62..." error={addrErrors.phone} />
          <Input
            label="Country *"
            value={addrForm.country}
            onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value, city_id: isInternational({ country: e.target.value }) ? null : addrForm.city_id })}
            error={addrErrors.country}
          />
          {isInternational(addrForm) ? (
            <Input label="City / State *" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} error={addrErrors.city} />
          ) : (
            <CitySearchInput value={addrForm.city} cityId={addrForm.city_id} onChange={({ name, id, province }) => setAddrForm({ ...addrForm, city: name, city_id: id, province })} error={addrErrors.city} />
          )}
          <div className="sm:col-span-2">
            <Input label="Address details *" value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="Street, RT/RW, district, sub-district" error={addrErrors.address} />
          </div>
          <Input label="Postal code" value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} error={addrErrors.postal_code} />
        </form>
      </Modal>
    </div>
  )
}

function AddressOption({ addr, selected, onSelect }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg cursor-pointer border transition',
        selected ? 'border-ink bg-paper-soft shadow-card' : 'border-transparent shadow-card hover:shadow-hover',
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
          <span className="eyebrow">{addr.label}</span>
          {addr.is_default && <span className="text-2xs px-1.5 py-0.5 bg-ink text-white rounded">Default</span>}
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
