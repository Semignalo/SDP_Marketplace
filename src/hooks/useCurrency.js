import { useCallback } from 'react'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { useRegionContext } from './useRegion'
import { formatRupiah, formatRupiahShort } from '../lib/utils'

// Locale per currency untuk Intl — menentukan simbol & pemisah ribuan yang benar
// (A$ vs $, ₹ dengan grouping lakh, dst).
const CURRENCY_LOCALES = {
  IDR: 'id-ID',
  USD: 'en-US',
  AUD: 'en-AU',
  INR: 'en-IN',
  PHP: 'en-PH',
}

/**
 * Kode currency selalu ditambahkan di belakang ("$24.32 AUD"), bukan cuma simbolnya —
 * AUD, USD, dan SGD semua pakai simbol "$" yang sama, jadi simbol sendirian ambigu.
 * IDR tidak lewat fungsi ini (formatRupiah pakai "Rp" yang sudah jelas).
 */
export function formatCurrency(value, currency, locale) {
  const amount = new Intl.NumberFormat(locale || CURRENCY_LOCALES[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

  return `${amount} ${currency}`
}

/**
 * Kurs aktif (berapa IDR per 1 unit currency tampilan) + currency-nya.
 * Kalau kursnya belum tersedia, jatuh balik ke IDR daripada menampilkan angka ngawur.
 */
function useDisplayCurrency() {
  const currency = useCurrencyStore((s) => s.currency)
  const locale = useCurrencyStore((s) => s.locale)
  const { data } = useRegionContext()

  const rate = currency === 'IDR' ? 1 : Number(data?.rates?.[currency]) || null

  return rate ? { currency, locale, rate } : { currency: 'IDR', locale: 'id-ID', rate: 1 }
}

/**
 * Format harga (nilai selalu masuk dalam IDR) ke currency tampilan yang aktif.
 * Catatan: ini konversi tampilan saja — customer tetap ditagih dalam IDR.
 */
export function useFormatPrice() {
  const { currency, locale, rate } = useDisplayCurrency()

  return useCallback(
    (value) =>
      currency === 'IDR'
        ? formatRupiah(value)
        : formatCurrency((Number(value) || 0) / rate, currency, locale),
    [currency, locale, rate],
  )
}

// Varian ringkas untuk chart & tooltip. Currency asing sudah jauh lebih kecil
// angkanya daripada IDR, jadi cuma IDR yang perlu disingkat.
export function useFormatPriceShort() {
  const { currency, locale, rate } = useDisplayCurrency()

  return useCallback(
    (value) =>
      currency === 'IDR'
        ? formatRupiahShort(value)
        : formatCurrency((Number(value) || 0) / rate, currency, locale),
    [currency, locale, rate],
  )
}
