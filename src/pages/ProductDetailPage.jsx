import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Minus, Plus, ShieldCheck, Truck, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import ProductCard from '../components/ProductCard'
import WishlistButton from '../components/WishlistButton'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '../stores/useCartStore'
import { useUIStore } from '../stores/useUIStore'
import { Button, PriceLabel, Skeleton, EmptyState } from '../components/ui'
import { formatRupiah, cn } from '../lib/utils'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { data, isLoading, error } = useProduct(slug)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const navigate = useNavigate()
  const addToCart = useCartStore((s) => s.add)
  const openCart = useUIStore((s) => s.openCart)

  if (isLoading) return <ProductDetailSkeleton />
  if (error || !data?.data) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Produk tidak ditemukan"
          description="Produk yang kamu cari tidak tersedia atau sudah dihapus."
          action={<Link to="/products"><Button variant="outline">Lihat Semua Produk</Button></Link>}
        />
      </div>
    )
  }

  const product = data.data
  const related = data.related || []
  const images = product.images?.length ? product.images : (product.primary_image ? [{ url: product.primary_image }] : [])
  const price = product.price

  const handleAddToCart = () => {
    addToCart(product, qty)
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  const handleBuyNow = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  return (
    <div className="container-page py-6 lg:py-10">
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link to="/" className="hover:text-ink">Beranda</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-ink">Produk</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 mb-20">
        <div>
          <div className="aspect-square bg-paper-warm overflow-hidden rounded">
            {images[activeImg]?.url && (
              <img src={images[activeImg].url} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'shrink-0 w-16 h-16 rounded overflow-hidden bg-paper-warm border-2 transition',
                    activeImg === i ? 'border-ink' : 'border-transparent hover:border-line-strong',
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          {product.vendor && (
            <Link
              to={`/vendor/${product.vendor.slug}`}
              className="inline-block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted hover:text-ink mb-3"
            >
              {product.vendor.name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
            {product.name}
          </h1>

          <div className="mt-4">
            <PriceLabel price={price} size="lg" />
          </div>

          <div className="mt-3 text-xs text-ink-muted">
            {product.stock > 0 ? (
              <span>Stok: {product.stock} tersedia</span>
            ) : (
              <span className="text-state-danger">Stok habis</span>
            )}
            {product.sku && <span className="ml-3">SKU: {product.sku}</span>}
          </div>

          {product.description && (
            <div className="mt-6 pt-6 border-t border-line">
              <p className="text-2xs uppercase tracking-widest text-ink-muted mb-2">Deskripsi</p>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-2xs uppercase tracking-widest text-ink-muted mb-3">Jumlah</p>
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center border border-line rounded">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="h-11 w-11 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                  aria-label="Kurangi"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  className="h-11 w-11 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                  aria-label="Tambah"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-sm text-ink-muted">
                Subtotal: <strong className="text-ink tabular-nums">{formatRupiah(price * qty)}</strong>
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={handleAddToCart} disabled={!product.in_stock}>
              + Keranjang
            </Button>
            <Button variant="primary" size="lg" onClick={handleBuyNow} disabled={!product.in_stock}>
              Beli Sekarang
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
            <WishlistButton productId={product.id} variant="inline" />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-ink transition"
              onClick={async () => {
                const url = window.location.href
                if (navigator.share) {
                  await navigator.share({ title: product.name, url })
                } else {
                  await navigator.clipboard.writeText(url)
                  toast.success('Link produk disalin!')
                }
              }}
            >
              <Share2 size={14} /> Bagikan
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-line space-y-3">
            <Perk icon={<Truck size={16} />} text="Gratis ongkir min. Rp 150.000" />
            <Perk icon={<ShieldCheck size={16} />} text="Produk original, retur mudah dalam 7 hari" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line pt-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-6">
            Mungkin Kamu Suka
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function Perk({ icon, text }) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-soft">
      <span className="text-ink shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-4 w-1/3 mb-6" />
      <div className="grid lg:grid-cols-2 gap-14">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
