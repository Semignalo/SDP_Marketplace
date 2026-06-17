import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '../../hooks/useAccount'
import ProductCard from '../../components/ProductCard'
import { Button, EmptyState, SkeletonProductCard } from '../../components/ui'

export default function WishlistPage() {
  const { data: products = [], isLoading } = useWishlist()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Your Wishlist</h2>
        <p className="text-sm text-ink-muted mt-1">
          {isLoading ? 'Loading…' : `${products.length} saved products`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} strokeWidth={1.2} />}
          title="Your wishlist is empty."
          description="Tap the heart icon on any product to save it here."
          action={<Link to="/products"><Button variant="outline">Browse products</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
