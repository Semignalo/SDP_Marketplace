import { Link } from 'react-router-dom'
import { Badge } from './ui'
import { PriceLabel } from './ui'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product }) {
  const image = product.primary_image || product.images?.[0]?.url
  const price = product.price

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-paper-warm overflow-hidden rounded mb-3">
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
      <PriceLabel price={price} size="sm" />
    </Link>
  )
}
