import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Badge } from './ui'
import { PriceLabel } from './ui'
import WishlistButton from './WishlistButton'

const LOW_STOCK_THRESHOLD = 5

export default function ProductCard({ product }) {
  const image = product.primary_image || product.images?.[0]?.url
  const price = product.price
  const isLowStock = product.in_stock && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square bg-paper-warm overflow-hidden rounded mb-3">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-faint text-xs">
            No image
          </div>
        )}

        {!product.in_stock && (
          <div className="absolute inset-0 bg-paper/70 backdrop-blur-[1px] flex items-center justify-center">
            <Badge variant="ink">Stok Habis</Badge>
          </div>
        )}

        {isLowStock && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant="danger">Sisa {product.stock}</Badge>
          </div>
        )}

        <WishlistButton
          productId={product.id}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100"
        />
      </div>

      <p className="text-2xs uppercase tracking-widest text-ink-faint mb-1">
        {product.vendor?.name || ''}
      </p>
      <h3 className="text-sm text-ink line-clamp-2 leading-snug mb-1.5 group-hover:text-ink-soft transition">
        {product.name}
      </h3>
      {product.rating_avg && (
        <div className="flex items-center gap-1 mb-1 text-2xs text-ink-muted">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold text-ink-soft">{product.rating_avg}</span>
          <span>({product.reviews_count})</span>
        </div>
      )}
      <PriceLabel price={price} oldPrice={product.compare_at_price} size="sm" />
    </Link>
  )
}
