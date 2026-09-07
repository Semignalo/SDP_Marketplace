import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { COUNTRIES } from '../lib/countries'

/**
 * Konteks lokalisasi dari server: negara hasil deteksi IP, daftar region, dan kurs.
 * Satu request, di-cache lama — IP pengunjung tidak berubah di tengah sesi.
 */
export function useRegionContext() {
  return useQuery({
    queryKey: ['storefront', 'region'],
    queryFn: async () => {
      const { data } = await api.get('/storefront/region')
      return data.data
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Terapkan hasil geo-detect sekali saat boot. Tidak menimpa pilihan manual user
 * (dijaga di dalam store lewat `source`).
 */
export function useApplyDetectedRegion() {
  const { data } = useRegionContext()
  const applyDetected = useCurrencyStore((s) => s.applyDetected)

  useEffect(() => {
    const detected = data?.detected
    if (!detected?.supported) return

    applyDetected({
      country: detected.country_code,
      currency: detected.currency,
      locale: detected.locale,
    })
  }, [data, applyDetected])
}

/**
 * Negara aktif untuk query produk. Dikirim sebagai ?country= supaya server
 * memuat override harga regional yang tepat — dan supaya react-query
 * memisahkan cache antar-region.
 */
export function useActiveCountry() {
  return useCurrencyStore((s) => s.country) ?? undefined
}

/**
 * Order dari India diarahkan ke storefront Razorpay eksternal, bukan checkout
 * lewat SDP — lihat IndiaStoreNotice.
 */
export const INDIA_STORE_URL = 'https://pages.razorpay.com/stores/edelis'

export function useIsIndia() {
  return useActiveCountry() === 'IN'
}

/**
 * Semua negara untuk dropdown "Choose your country" — bukan cuma 4 yang
 * dilokalkan. Memilih ini TIDAK menentukan kemana barang bisa dikirim (itu
 * tetap manual quote di checkout); murni preferensi tampilan currency.
 *
 * `localized` = 4 negara yang punya currency & harga regional sendiri (dari API).
 * `others` = sisa dunia — dipilih tetap tersimpan sebagai country (buat referensi/
 * analytics), tapi currency-nya jatuh ke USD (referensi netral yang sudah dikenal
 * sistem), bukan IDR — karena IDR belum tentu familiar buat pengunjung negara lain.
 */
export function useCountryOptions() {
  const { data } = useRegionContext()
  const regions = data?.regions ?? []
  const usdRate = data?.rates?.USD ?? null

  const localizedCodes = useMemo(() => new Set(regions.map((r) => r.country_code)), [regions])

  const others = useMemo(
    () =>
      COUNTRIES.filter((c) => !localizedCodes.has(c.code)).map((c) => ({
        country_code: c.code,
        country_name: c.name,
        currency: usdRate ? 'USD' : 'IDR',
        locale: usdRate ? 'en-US' : 'id-ID',
        rate_to_idr: usdRate ?? 1,
      })),
    [localizedCodes, usdRate],
  )

  return { localized: regions, others }
}

/**
 * Harga keranjang untuk negara TUJUAN KIRIM (bukan negara browsing).
 *
 * Keranjang menyimpan harga saat produk dimasukkan, sedangkan yang ditagih adalah
 * harga negara tujuan. Hook ini menutup selisihnya di layar checkout supaya angka
 * yang disetujui customer sama dengan yang ditagih.
 *
 * @param country nama negara tujuan ("Australia"), apa adanya dari form checkout
 * @param items   isi keranjang [{ product_id, quantity }]
 */
export function useRepricedCart(country, items) {
  const payload = (items ?? []).map((it) => ({
    product_id: it.product_id,
    quantity: it.quantity,
  }))

  return useQuery({
    queryKey: ['storefront', 'reprice', country, payload],
    queryFn: async () => {
      const { data } = await api.post('/storefront/reprice', { country, items: payload })
      return data.data
    },
    enabled: payload.length > 0,
    // Harga tidak boleh basi di layar bayar.
    staleTime: 0,
  })
}

/**
 * Pembungkus siap-pakai untuk layar checkout: harga per baris dan subtotal yang
 * sudah mengikuti negara tujuan, plus penanda kalau angkanya berbeda dari yang
 * tersimpan di keranjang (supaya perubahannya bisa dijelaskan ke customer).
 *
 * Selama data belum sampai, nilai keranjang dipakai apa adanya — jangan sampai
 * layar checkout kosong atau berkedip nol.
 */
export function useCartPricing(country, items) {
  const { data } = useRepricedCart(country, items)

  const lineByProduct = useMemo(
    () => new Map((data?.lines ?? []).map((l) => [l.product_id, l])),
    [data],
  )

  const cartSubtotal = (items ?? []).reduce((sum, it) => sum + it.price * it.quantity, 0)
  const subtotal = data?.subtotal ?? cartSubtotal

  return {
    subtotal,
    priceFor: (item) => lineByProduct.get(item.product_id)?.price ?? item.price,
    // Dibulatkan dulu — selisih pecahan sen bukan perubahan harga yang perlu diumumkan.
    changed: data ? Math.round(subtotal) !== Math.round(cartSubtotal) : false,
  }
}
