import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, ShieldCheck, Truck } from 'lucide-react'
import { useCartStore } from '../stores/useCartStore'
import { useUIStore } from '../stores/useUIStore'
import { Button, PriceLabel } from '../components/ui'
import { formatRupiah } from '../lib/utils'

export default function BuyNowPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const addToCart = useCartStore((s) => s.add)
  const openCart = useUIStore((s) => s.openCart)

  useEffect(() => {
    if (!state?.product) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state?.product) return null

  const { product, qty } = state
  const images = product.images?.length
    ? product.images
    : product.primary_image ? [{ url: product.primary_image }] : []
  const total = product.price * qty

  const handleConfirm = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  const handleAddToCart = () => {
    addToCart(product, qty)
    openCart()
    navigate(-1)
  }

  return (
    <div className="container-page py-8 max-w-xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link to="/" className="hover:text-ink">Beranda</Link>
        <ChevronRight size={12} />
        <Link to={`/products/${product.slug}`} className="hover:text-ink truncate max-w-[160px]">{product.name}</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Konfirmasi</span>
      </nav>

      <h1 className="text-xl font-bold tracking-tight text-ink mb-6">Konfirmasi Pesanan</h1>

      {/* Product card */}
      <div className="border border-line rounded-lg p-5 flex gap-4 bg-paper">
        {images[0]?.url && (
          <div className="w-24 h-24 shrink-0 rounded overflow-hidden bg-paper-warm">
            <img src={images[0].url} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {product.vendor && (
            <p className="text-2xs uppercase tracking-widest text-ink-muted">{product.vendor.name}</p>
          )}
          <p className="text-sm font-semibold text-ink mt-0.5 leading-snug">{product.name}</p>
          <div className="mt-2">
            <PriceLabel price={product.price} size="sm" />
          </div>
          <p className="text-xs text-ink-muted mt-1">Jumlah: <strong className="text-ink">{qty}</strong></p>
        </div>
      </div>

      {/* Ringkasan harga */}
      <div className="mt-4 border border-line rounded-lg p-5 bg-paper space-y-3">
        <p className="text-2xs uppercase tracking-widest text-ink-muted">Ringkasan Harga</p>
        <div className="flex justify-between text-sm text-ink-soft">
          <span>Subtotal ({qty} barang)</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Ongkos kirim</span>
          <span className="text-xs italic">dihitung di checkout</span>
        </div>
        <div className="pt-3 border-t border-line flex justify-between font-bold text-ink">
          <span>Total</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <Truck size={14} className="shrink-0" />
          <span>Gratis ongkir min. Rp 150.000</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <ShieldCheck size={14} className="shrink-0" />
          <span>Produk original, retur mudah dalam 7 hari</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={handleAddToCart}>
          + Keranjang
        </Button>
        <Button size="lg" onClick={handleConfirm}>
          Checkout Sekarang
        </Button>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-4 block w-full text-center text-xs text-ink-muted hover:text-ink py-2"
      >
        ← Kembali ke produk
      </button>
    </div>
  )
}
