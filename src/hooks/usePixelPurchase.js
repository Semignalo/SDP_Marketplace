import { useEffect } from 'react'
import { trackEvent } from '../lib/metaPixel'

const PAID = ['processing', 'shipped', 'completed']

// Purchase di browser — hanya saat customer baru saja membayar (?paid=1) dan status sudah
// terbayar, sekali per order per browser. Sisi server (Conversions API) mengirim event yang
// sama dengan event_id identik, jadi Meta men-dedupe dan tetap ada cadangan kalau tab ditutup.
export function usePixelPurchase(order, paidFromCheckout) {
  useEffect(() => {
    if (!paidFromCheckout || !order || !PAID.includes(order.status)) return

    const flag = `sdp-px-purchase-${order.order_number}`
    try {
      if (localStorage.getItem(flag)) return
      localStorage.setItem(flag, '1')
    } catch { /* tanpa localStorage: lebih baik tidak mengirim ganda */ return }

    trackEvent('Purchase', {
      content_type: 'product',
      contents: (order.items || []).map((it) => ({
        id: String(it.product_id),
        quantity: it.quantity,
        item_price: it.price,
      })),
      num_items: (order.items || []).reduce((sum, it) => sum + it.quantity, 0),
      value: order.total,
      // Selalu IDR: itu mata uang yang ditagih, bukan mata uang tampilan regional.
      currency: 'IDR',
    }, `purchase-${order.order_number}`)
  }, [order, paidFromCheckout])
}
