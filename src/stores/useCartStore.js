import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      add(product, quantity = 1) {
        const items = [...get().items]
        const idx = items.findIndex((it) => it.product_id === product.id)
        if (idx >= 0) {
          const next = Math.min(items[idx].quantity + quantity, product.stock ?? 999)
          items[idx] = { ...items[idx], quantity: next }
        } else {
          items.push({
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.primary_image ?? product.images?.[0]?.url ?? null,
            vendor_name: product.vendor?.name ?? '',
            vendor_slug: product.vendor?.slug ?? '',
            stock: product.stock ?? 999,
            quantity: Math.min(quantity, product.stock ?? 999),
          })
        }
        set({ items })
      },

      remove(productId) {
        set({ items: get().items.filter((it) => it.product_id !== productId) })
      },

      setQuantity(productId, quantity) {
        const items = get().items.map((it) => {
          if (it.product_id !== productId) return it
          const q = Math.max(1, Math.min(quantity, it.stock ?? 999))
          return { ...it, quantity: q }
        })
        set({ items })
      },

      clear() {
        set({ items: [] })
      },

      count() {
        return get().items.reduce((sum, it) => sum + it.quantity, 0)
      },

      subtotal() {
        return get().items.reduce((sum, it) => sum + it.price * it.quantity, 0)
      },
    }),
    {
      name: 'sdp-cart',
    },
  ),
)
