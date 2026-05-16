import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight, Truck, Award } from 'lucide-react'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { usePublicSettings } from '../hooks/useProducts'
import { Button, EmptyState, PriceLabel } from '../components/ui'
import TierBadge from '../components/TierBadge'
import { formatRupiah } from '../lib/utils'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const removeItem = useCartStore((s) => s.remove)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const { data: settings } = usePublicSettings()
  const user = useAuthStore((s) => s.user)

  const tier = user?.tier
  const tierDiscount = tier ? Math.round(subtotal * tier.discount / 100) : 0
  const subtotalAfterTier = subtotal - tierDiscount

  const freeShippingMin = Number(settings?.shipping_min_free || 150000)
  const remaining = Math.max(0, freeShippingMin - subtotalAfterTier)
  const progress = Math.min(100, (subtotalAfterTier / freeShippingMin) * 100)

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={<ShoppingBag size={48} strokeWidth={1.2} />}
          title="Keranjang masih kosong"
          description="Jelajahi koleksi dan tambahkan favorit kamu ke keranjang."
          action={
            <Link to="/products">
              <Button variant="primary">Mulai Belanja</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mb-1">Keranjang Belanja</h1>
      <p className="text-sm text-ink-muted mb-8">{items.length} produk · {items.reduce((s, i) => s + i.quantity, 0)} item</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="border border-line rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_140px_140px_40px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
              <span>Produk</span>
              <span className="text-center">Jumlah</span>
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
                      <p className="text-2xs uppercase tracking-widest text-ink-faint">{item.vendor_name}</p>
                      <Link to={`/products/${item.slug}`} className="block">
                        <h3 className="text-sm text-ink line-clamp-2 hover:text-ink-soft">{item.name}</h3>
                      </Link>
                      <div className="mt-1.5 md:hidden">
                        <PriceLabel price={item.price} size="sm" />
                      </div>
                      <p className="hidden md:block text-xs text-ink-muted mt-1 tabular-nums">{formatRupiah(item.price)}</p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex md:justify-center items-center justify-between">
                    <div className="inline-flex items-center border border-line rounded">
                      <button
                        onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-9 w-9 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                        aria-label="Kurangi"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="h-9 w-9 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                        aria-label="Tambah"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="md:hidden text-sm font-semibold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
                  </div>

                  <p className="hidden md:block text-right text-sm font-semibold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>

                  <div className="hidden md:flex justify-end">
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-ink-muted hover:text-state-danger transition p-2"
                      aria-label="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="md:hidden mt-3 flex justify-end">
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-xs text-ink-muted hover:text-state-danger inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <Link to="/products" className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1.5">
              ← Lanjutkan belanja
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="border border-line rounded-lg p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Ringkasan</h2>

            {tier && (
              <div className="mb-4 pb-4 border-b border-line flex items-center gap-2">
                <TierBadge tier={tier} size="sm" />
                <span className="text-2xs text-ink-muted">{tier.discount}% off di checkout</span>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">{formatRupiah(subtotal)}</dd>
              </div>
              {tier && tierDiscount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Diskon {tier.name}</dt>
                  <dd className="text-state-success tabular-nums">−{formatRupiah(tierDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Ongkir</dt>
                <dd className="text-ink-muted text-xs">Dihitung di checkout</dd>
              </div>
              <div className="pt-3 border-t border-line flex justify-between items-baseline">
                <dt className="text-sm font-semibold">Total Estimasi</dt>
                <dd className="text-lg font-bold tabular-nums">{formatRupiah(subtotalAfterTier)}</dd>
              </div>
            </dl>

            <Link to="/checkout" className="block mt-5">
              <Button fullWidth size="lg" className="group">
                Lanjut ke Checkout
                <ArrowRight size={16} className="ml-1.5 transition group-hover:translate-x-0.5" />
              </Button>
            </Link>

            {!user && (
              <Link to="/login?next=/keranjang" className="block mt-3 text-2xs text-ink-muted hover:text-ink text-center inline-flex items-center justify-center gap-1 w-full">
                <Award size={11} /> Login untuk dapatkan diskon tier
              </Link>
            )}
          </div>

          {freeShippingMin > 0 && (
            <div className="border border-line rounded-lg p-4 bg-paper-soft">
              <div className="flex items-start gap-2.5">
                <Truck size={16} className="text-ink-soft mt-0.5 shrink-0" />
                <div className="flex-1">
                  {remaining > 0 ? (
                    <>
                      <p className="text-xs text-ink-soft">
                        Tambah <strong className="text-ink tabular-nums">{formatRupiah(remaining)}</strong> lagi untuk gratis ongkir.
                      </p>
                      <div className="mt-2 h-1 bg-line rounded-full overflow-hidden">
                        <div className="h-full bg-ink transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-state-success font-semibold">
                      Selamat! Pesananmu mendapat gratis ongkir.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
