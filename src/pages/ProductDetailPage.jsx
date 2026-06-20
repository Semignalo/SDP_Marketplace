import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck, Truck, Share2, Star, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import ProductCard from '../components/ProductCard'
import WishlistButton from '../components/WishlistButton'
import { useProduct } from '../hooks/useProducts'
import { useProductReviews, useReviewEligibility, useSubmitReview } from '../hooks/useReviews'
import { useCartStore } from '../stores/useCartStore'
import { useUIStore } from '../stores/useUIStore'
import { useAuthStore } from '../stores/useAuthStore'
import { Button, Card, PriceLabel, Skeleton, EmptyState, QuantityStepper, Spinner, StarRating, Textarea } from '../components/ui'
import { extractErrorMessage } from '../lib/api'
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
          title="We couldn't find this product."
          description="It may have sold out or been removed."
          action={<Link to="/products"><Button variant="outline">Browse all products</Button></Link>}
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
    toast.success(`Added ${product.name} to cart`)
  }

  const handleBuyNow = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  return (
    <div className="container-page pt-6 lg:pt-10 pb-24 lg:pb-10">
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-ink">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 mb-20">
        <div>
          <div className="aspect-square bg-paper-warm overflow-hidden rounded-lg shadow-card">
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
              className="inline-block text-2xs font-bold uppercase tracking-eyebrow text-ink-muted hover:text-ink mb-3"
            >
              {product.vendor.name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
            {product.name}
          </h1>

          {product.rating_avg && (
            <StarRating value={product.rating_avg} count={product.reviews_count} label="reviews" size="md" className="mt-2" />
          )}

          <div className="mt-4">
            <PriceLabel price={price} oldPrice={product.compare_at_price} size="lg" />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            {product.stock > 0 ? (
              product.stock <= 5 ? (
                <span className="font-semibold text-state-danger">Almost gone — {product.stock} left</span>
              ) : (
                <span>{product.stock} in stock</span>
              )
            ) : (
              <span className="text-state-danger">Sold out</span>
            )}
            {product.sku && <span className="ml-1">SKU: {product.sku}</span>}
          </div>

          {product.description && (
            <div className="mt-6 pt-6 border-t border-line">
              <p className="text-2xs uppercase tracking-widest text-ink-muted mb-2">Description</p>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-2xs uppercase tracking-widest text-ink-muted mb-3">Quantity</p>
            <div className="flex items-center justify-between gap-4">
              <QuantityStepper
                value={qty}
                max={product.stock}
                onChange={(n) => setQty(Math.min(Math.max(1, n), product.stock))}
              />
              <p className="text-sm text-ink-muted">
                Subtotal: <strong className="text-ink tabular-nums">{formatRupiah(price * qty)}</strong>
              </p>
            </div>
          </div>

          <div className="mt-6 hidden lg:grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={handleAddToCart} disabled={!product.in_stock}>
              Add to cart
            </Button>
            <Button variant="accent" size="lg" onClick={handleBuyNow} disabled={!product.in_stock}>
              Buy now
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
                  toast.success('Link copied!')
                }
              }}
            >
              <Share2 size={14} /> Share
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-line space-y-3">
            <Perk icon={<Truck size={16} />} text="Free shipping over Rp 150,000" />
            <Perk icon={<ShieldCheck size={16} />} text="Genuine products. Easy 7-day returns." />
          </div>
        </div>
      </div>

      <ReviewsSection slug={slug} productId={product.id} />

      {related.length > 0 && (
        <section className="border-t border-line pt-12 mt-12">
          <h2 className="text-xs font-bold uppercase tracking-eyebrow text-ink-muted mb-6">
            You might also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Sticky buy bar — mobile only; menggantikan tombol inline yang di-hidden di <lg */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-line shadow-hover">
        <div className="container-page py-3 flex items-center gap-3">
          <div className="min-w-0">
            <PriceLabel price={price} oldPrice={product.compare_at_price} size="md" />
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              aria-label="Add to cart"
              className="px-4"
            >
              <ShoppingBag size={18} />
            </Button>
            <Button variant="accent" size="md" onClick={handleBuyNow} disabled={!product.in_stock} className="px-6">
              {product.in_stock ? 'Buy now' : 'Sold out'}
            </Button>
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
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

function ReviewsSection({ slug, productId }) {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useProductReviews(slug)
  const { data: eligibility } = useReviewEligibility(slug)

  const reviews = data?.data || []
  const ratingAvg = data?.meta_extra?.rating_avg
  const reviewsCount = data?.meta_extra?.reviews_count || 0

  return (
    <section className="border-t border-line pt-12 mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold uppercase tracking-eyebrow text-ink-muted">
          Customer Reviews
        </h2>
        {ratingAvg && <StarRating value={ratingAvg} count={reviewsCount} size="md" />}
      </div>

      {user && eligibility?.eligible && (
        <ReviewForm slug={slug} productId={productId} orderId={eligibility.order_id} />
      )}

      {isLoading ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-muted py-4">No reviews yet — be the first.</p>
      ) : (
        <ul className="divide-y divide-line">
          {reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
        </ul>
      )}
    </section>
  )
}

function ReviewItem({ review }) {
  return (
    <li className="py-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className={i < review.rating ? 'fill-rating text-rating' : 'text-line-strong'}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-ink">{review.user_name}</p>
      </div>
      {review.comment && <p className="text-sm text-ink-soft leading-relaxed">{review.comment}</p>}
    </li>
  )
}

function ReviewForm({ slug, productId, orderId }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const submitReview = useSubmitReview(slug)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await submitReview.mutateAsync({ product_id: productId, order_id: orderId, rating, comment: comment || undefined })
      setComment('')
      toast.success('Thanks — review submitted!')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Card padding="md" className="mb-8 space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Write a review</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              className="p-0.5"
              aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
            >
              <Star
                size={22}
                className={i < rating ? 'fill-rating text-rating' : 'text-line-strong hover:text-rating/60'}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Tell us what you thought (optional)"
        />
        <Button type="submit" size="sm" loading={submitReview.isPending}>
          Submit review
        </Button>
      </form>
    </Card>
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
