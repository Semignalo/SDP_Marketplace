import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useCartStore } from '../stores/useCartStore'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { useUIStore } from '../stores/useUIStore'

/**
 * Sinkronkan keranjang tiap kali negara browsing (region switcher/geo-detect) berubah.
 * Item yang gak available di negara baru dihapus, yang qty-nya kelebihan diturunkan
 * ke maksimum yang tersedia — plus notifikasi (toast + banner persisten di CartPage,
 * lihat CartAdjustmentNotice) yang jelasin apa yang berubah.
 *
 * Trigger HARUS berbasis perubahan `country` (via ref guard), BUKAN perubahan `items` —
 * hook ini sendiri yang mengubah `items` (remove/setQuantity), gampang infinite-loop
 * kalau salah desain.
 *
 * Ini cuma sinyal cart-hygiene (advisory) — enforcement sesungguhnya tetap di checkout
 * server-side, endpoint ini tidak locking apapun.
 */
export function useCartAvailabilitySync() {
  const country = useCurrencyStore((s) => s.country)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.remove)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const setLastCartAdjustment = useUIStore((s) => s.setLastCartAdjustment)
  const lastChecked = useRef(undefined)

  const check = useMutation({
    mutationFn: async ({ country, items }) => {
      const payload = items.map((it) => ({ product_id: it.product_id, quantity: it.quantity }))
      const { data } = await api.post('/storefront/availability', { country, items: payload })
      return data.data
    },
  })

  useEffect(() => {
    if (!items.length || lastChecked.current === country) return
    lastChecked.current = country

    check.mutate(
      { country, items },
      {
        onSuccess: (data) => {
          const removed = []
          const reduced = []

          for (const line of data.lines) {
            const cartItem = items.find((it) => it.product_id === line.product_id)
            if (!cartItem) continue

            if (!line.ok && line.available_qty <= 0) {
              removeItem(line.product_id)
              removed.push(cartItem.name)
            } else if (!line.ok && line.available_qty > 0) {
              setQuantity(line.product_id, line.available_qty)
              reduced.push(`${cartItem.name} (now ${line.available_qty})`)
            }
          }

          if (removed.length || reduced.length) {
            const message = [
              removed.length && `Removed from cart (not available in your region): ${removed.join(', ')}`,
              reduced.length && `Quantity reduced: ${reduced.join(', ')}`,
            ].filter(Boolean).join('. ')

            toast.warning(message, { duration: 8000 })
            setLastCartAdjustment({ removed, reduced, at: Date.now() })
          }
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, items.length])
}
