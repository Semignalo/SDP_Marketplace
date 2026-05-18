import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useCartStore } from '../stores/useCartStore'
import { Drawer, Button, EmptyState, PriceLabel } from './ui'
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
      title={items.length > 0 ? `Keranjang (${items.length})` : 'Keranjang'}
      footer={items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest text-ink-muted">Subtotal</span>
            <span className="text-lg font-bold tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
          <p className="text-2xs text-ink-muted">Ongkir & pajak dihitung di checkout</p>
          <Link to="/checkout" onClick={close}>
            <Button fullWidth size="lg">Checkout</Button>
          </Link>
          <button
            onClick={close}
            className="block w-full text-center text-xs text-ink-muted hover:text-ink py-1"
          >
            Lanjutkan Belanja
          </button>
        </div>
      )}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={40} strokeWidth={1.2} />}
          title="Keranjang kosong"
          description="Mulai jelajahi koleksi dan tambahkan ke keranjang."
          action={
            <Link to="/products" onClick={close}>
              <Button variant="outline">Mulai Belanja</Button>
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
                <p className="text-2xs uppercase tracking-widest text-ink-faint">{item.vendor_name}</p>
                <Link to={`/products/${item.slug}`} onClick={close}>
                  <h3 className="text-sm text-ink line-clamp-2 hover:text-ink-soft">{item.name}</h3>
                </Link>
                <div className="mt-1.5">
                  <PriceLabel price={item.price} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center border border-line rounded">
                    <button
                      onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                      aria-label="Kurangi"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val)) setQuantity(item.product_id, Math.min(Math.max(1, val), item.stock))
                      }}
                      className="w-10 text-center text-xs font-semibold tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-soft hover:bg-paper-warm disabled:opacity-40"
                      aria-label="Tambah"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-ink-muted hover:text-state-danger transition"
                    aria-label="Hapus"
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
