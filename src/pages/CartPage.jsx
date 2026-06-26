import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, ArrowRight, Truck, Award } from 'lucide-react'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { usePublicSettings } from '../hooks/useProducts'
import { Button, Card, EmptyState, PriceLabel, QuantityStepper } from '../components/ui'
import TierBadge from '../components/TierBadge'
import { calcTierDiscount } from '../lib/pricing'
import { useFormatPrice } from '../hooks/useCurrency'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const removeItem = useCartStore((s) => s.remove)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const { data: settings } = usePublicSettings()
  const user = useAuthStore((s) => s.user)
  const formatPrice = useFormatPrice()

  const tier = user?.tier
  const tierMaxDiscount = Number(settings?.tier_max_discount_rupiah || 0)
  const tierDiscount = calcTierDiscount(subtotal, tier, tierMaxDiscount)
  const subtotalAfterTier = subtotal - tierDiscount

  const freeShippingMin = Number(settings?.shipping_min_free || 150000)
  const remaining = Math.max(0, freeShippingMin - subtotalAfterTier)
  const progress = Math.min(100, (subtotalAfterTier / freeShippingMin) * 100)

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={<ShoppingBag size={48} strokeWidth={1.2} />}
          title="Your cart's empty."
          description="Let's find something you'll love."
          action={
            <Link to="/products">
              <Button variant="primary">Start shopping</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mb-1">Your Cart</h1>
      <p className="text-sm text-ink-muted mb-8">{items.length} products · {items.reduce((s, i) => s + i.quantity, 0)} items</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <Card padding="none" className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_140px_140px_40px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Subtotal</span>
              <span></span>
            </div>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.product_id} className="p-4 md:p-5 md:grid md:grid-cols-[1fr_140px_140px_40px] md:gap-4 md:items-center">
                  <div className="flex gap-4">
                    <Link to={`/products/${item.slug}`} className="shrink-0">
                      <div className="h-24 w-20 bg-paper-warm overflow-hidden rounded">
                        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs uppercase tracking-widest text-ink-muted">{item.vendor_name}</p>
                      <Link to={`/products/${item.slug}`} className="block">
                        <h3 className="text-sm text-ink line-clamp-2 hover:text-ink-soft">{item.name}</h3>
                      </Link>
                      <div className="mt-1.5 md:hidden">
                        <PriceLabel price={item.price} size="sm" />
                      </div>
                      <p className="hidden md:block text-xs text-ink-muted mt-1 tabular-nums">{formatPrice(item.price)}</p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex md:justify-center items-center justify-between">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      max={item.stock}
                      onChange={(n) => setQuantity(item.product_id, Math.min(Math.max(1, n), item.stock))}
                    />
                    <p className="md:hidden text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                  </div>

                  <p className="hidden md:block text-right text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>

                  <div className="hidden md:flex justify-end">
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-ink-muted hover:text-state-danger transition p-2"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="md:hidden mt-3 flex justify-end">
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-xs text-ink-muted hover:text-state-danger inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div className="mt-4">
            <Link to="/products" className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1.5">
              ← Keep browsing
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <Card padding="md">
            <h2 className="eyebrow mb-4">Summary</h2>

            {tier && (
              <div className="mb-4 pb-4 border-b border-line flex items-center gap-2">
                <TierBadge tier={tier} size="sm" />
                <span className="text-2xs text-ink-muted">{tier.discount}% off at checkout</span>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {tier && tierDiscount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">{tier.name} discount</dt>
                  <dd className="text-state-success tabular-nums">−{formatPrice(tierDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="text-ink-muted text-xs">Calculated at checkout</dd>
              </div>
              <div className="pt-3 border-t border-line flex justify-between items-baseline">
                <dt className="text-sm font-semibold">Estimated total</dt>
                <dd className="text-lg font-bold tabular-nums">{formatPrice(subtotalAfterTier)}</dd>
              </div>
            </dl>

            <Link to="/checkout" className="block mt-5">
              <Button variant="accent" fullWidth size="lg" className="group">
                Continue to checkout
                <ArrowRight size={16} className="ml-1.5 transition group-hover:translate-x-0.5" />
              </Button>
            </Link>

            {!user && (
              <Link to="/login?next=/keranjang" className="block mt-3 text-2xs text-ink-muted hover:text-ink text-center inline-flex items-center justify-center gap-1 w-full">
                <Award size={11} /> Sign in for tier discounts
              </Link>
            )}
          </Card>

          {freeShippingMin > 0 && (
            <Card padding="md" className="bg-paper-soft">
              <div className="flex items-start gap-2.5">
                <Truck size={16} className="text-ink-soft mt-0.5 shrink-0" />
                <div className="flex-1">
                  {remaining > 0 ? (
                    <>
                      <p className="text-xs text-ink-soft">
                        Add <strong className="text-ink tabular-nums">{formatPrice(remaining)}</strong> more for free shipping.
                      </p>
                      <div
                        className="mt-2 h-1 bg-line rounded-full overflow-hidden"
                        role="progressbar"
                        aria-label="Progress to free shipping"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full bg-ink transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-state-success font-semibold">
                      You've got free shipping on this order.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
