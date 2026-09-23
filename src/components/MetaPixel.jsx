import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePublicSettings } from '../hooks/useProducts'
import { useRegionContext } from '../hooks/useRegion'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { useCartStore } from '../stores/useCartStore'
import { disableMetaPixel, enableMetaPixel, trackEvent, trackPageView } from '../lib/metaPixel'

// Halaman internal — tidak ada nilai marketingnya.
const INTERNAL_PATH = /^\/(admin|akun)(\/|$)|^\/vendor(\/(produk|pesanan|profil).*)?$/

// Memuat Meta Pixel dan mencatat PageView + InitiateCheckout. Event lain (ViewContent,
// AddToCart, Purchase) dikirim dari halaman/store terkait lewat lib/metaPixel.
export default function MetaPixel() {
  const { pathname } = useLocation()
  const settings = usePublicSettings()
  const region = useRegionContext()

  const storeCountry = useCurrencyStore((s) => s.country)
  const source = useCurrencyStore((s) => s.source)

  const pixelId = settings.data?.meta_pixel_id?.trim() || ''
  const settled = (settings.isSuccess || settings.isError) && (region.isSuccess || region.isError)

  // Pilihan manual user menang; kalau tidak, pakai hasil deteksi IP terbaru.
  const detected = region.data?.detected?.country_code
  const country = source === 'manual' ? storeCountry : (detected ?? storeCountry)
  const blocked = country === 'IN' // checkout India diarahkan ke toko lain — jangan cemari audiens

  const active = settled && !!pixelId && !blocked

  useEffect(() => {
    if (!settled) return
    if (active) enableMetaPixel(pixelId)
    else disableMetaPixel()
  }, [settled, active, pixelId])

  useEffect(() => {
    if (!active || INTERNAL_PATH.test(pathname)) return
    trackPageView()
  }, [active, pathname])

  useEffect(() => {
    if (pathname !== '/checkout') return
    const items = useCartStore.getState().items
    if (!items.length) return
    trackEvent('InitiateCheckout', {
      content_type: 'product',
      contents: items.map((it) => ({ id: String(it.product_id), quantity: it.quantity, item_price: it.price })),
      num_items: items.reduce((sum, it) => sum + it.quantity, 0),
      value: items.reduce((sum, it) => sum + it.price * it.quantity, 0),
      currency: 'IDR',
    })
  }, [pathname])

  return null
}
