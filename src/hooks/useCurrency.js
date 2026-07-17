import { useCallback } from 'react'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { usePublicSettings } from './useProducts'
import { formatRupiah, formatRupiahShort } from '../lib/utils'

export function formatUsd(value, rate) {
  const usd = (Number(value) || 0) / (Number(rate) || 16000)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd)
}

export function useFormatPrice() {
  const currency = useCurrencyStore((s) => s.currency)
  const { data: settings } = usePublicSettings()
  const rate = Number(settings?.usd_idr_rate) || 16000

  return useCallback(
    (value) => (currency === 'USD' ? formatUsd(value, rate) : formatRupiah(value)),
    [currency, rate],
  )
}

// Compact variant for charts & tooltips. USD is ~16k× smaller so it's already
// short enough — only IDR needs abbreviating.
export function useFormatPriceShort() {
  const currency = useCurrencyStore((s) => s.currency)
  const { data: settings } = usePublicSettings()
  const rate = Number(settings?.usd_idr_rate) || 16000

  return useCallback(
    (value) => (currency === 'USD' ? formatUsd(value, rate) : formatRupiahShort(value)),
    [currency, rate],
  )
}
