import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useCartStore } from '../stores/useCartStore'
import { Drawer, Button, EmptyState, PriceLabel, QuantityStepper } from './ui'
import { formatRupiah } from '../lib/utils'

export default function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen)
  const close = useUIStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const removeItem = useCartStore((s) => s.remove)
  const setQuantity = useCartStore((s) => s.setQuantity)

  return (
    <Drawer
      open={open}
      onClose={close}
      title={items.length > 0 ? `Cart (${items.length})` : 'Cart'}
      footer={items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest text-ink-muted">Subtotal</span>
            <span className="text-lg font-bold tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
          <p className="text-2xs text-ink-muted">Shipping and tax — sorted at checkout.</p>
          <Link to="/checkout" onClick={close}>
            <Button variant="accent" fullWidth size="lg">Checkout</Button>
          </Link>
          <button
            onClick={close}
            className="block w-full text-center text-xs text-ink-muted hover:text-ink py-1"
          >
            Keep browsing
          </button>
        </div>
      )}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={40} strokeWidth={1.2} />}
          title="Your cart's empty."
          description="Let's find something you'll love."
          action={
            <Link to="/products" onClick={close}>
              <Button variant="outline">Start shopping</Button>
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.product_id} className="p-5 flex gap-4">
              <Link to={`/products/${item.slug}`} onClick={close} className="shrink-0">
                <div className="h-24 w-20 bg-paper-warm overflow-hidden rounded">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-2xs uppercase tracking-widest text-ink-muted">{item.vendor_name}</p>
                <Link to={`/products/${item.slug}`} onClick={close}>
                  <h3 className="text-sm text-ink line-clamp-2 hover:text-ink-soft">{item.name}</h3>
                </Link>
                <div className="mt-1.5">
                  <PriceLabel price={item.price} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    max={item.stock}
                    onChange={(n) => setQuantity(item.product_id, Math.min(Math.max(1, n), item.stock))}
                  />
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-ink-muted hover:text-state-danger transition"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
