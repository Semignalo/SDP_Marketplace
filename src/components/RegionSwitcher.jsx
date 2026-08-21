import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { useCountryOptions } from '../hooks/useRegion'
import { cn } from '../lib/utils'

/**
 * Pengganti toggle IDR/USD lama. Selain currency, pilihan di sini juga menentukan
 * negara — yang dipakai server untuk memuat harga regional yang benar.
 *
 * List datar semua negara (sama seperti RegionPopup) — bukan cuma yang dilokalkan.
 * Currency yang benar-benar terkonversi cuma 4 (IDR/AUD/INR/PHP), sisanya jatuh ke
 * USD (lihat useCountryOptions). Ini murni preferensi tampilan, TIDAK menentukan
 * kemana barang bisa dikirim — itu tetap manual quote di checkout.
 *
 * Deteksi IP bisa meleset (VPN, ISP lintas negara), jadi switcher manual ini
 * selalu tersedia dan pilihannya menang atas hasil deteksi.
 */
export default function RegionSwitcher({ className = '' }) {
  const { localized, others } = useCountryOptions()
  const currency = useCurrencyStore((s) => s.currency)
  const country = useCurrencyStore((s) => s.country)
  const setRegion = useCurrencyStore((s) => s.setRegion)

  const allOptions = [...localized, ...others].sort((a, b) =>
    a.country_name.localeCompare(b.country_name),
  )

  return (
    <Menu as="div" className={cn('relative shrink-0', className)}>
      <MenuButton
        className="h-9 inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper-soft px-3 text-2xs font-bold tracking-wide text-ink hover:bg-paper-warm transition"
        aria-label="Change region and currency"
      >
        <Globe size={14} strokeWidth={1.8} />
        {currency}
        <ChevronDown size={13} strokeWidth={2} className="text-ink-muted" />
      </MenuButton>

      <MenuItems className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto origin-top-right rounded-lg border border-line bg-paper shadow-hover z-50 py-1.5 focus:outline-none">
        <p className="px-3 pt-1 pb-2 text-2xs font-bold uppercase tracking-widest text-ink-muted sticky top-0 bg-paper">
          Choose your country
        </p>

        {allOptions.map((r) => {
          const active = country === r.country_code
          // Region tanpa kurs tidak bisa menampilkan harga lokal dengan benar.
          const disabled = r.currency !== 'IDR' && r.currency !== 'USD' && !r.rate_to_idr

          return (
            <MenuItem key={r.country_code} disabled={disabled}>
              <button
                type="button"
                onClick={() =>
                  setRegion({
                    country: r.country_code,
                    currency: r.currency,
                    locale: r.locale,
                  })
                }
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition',
                  disabled
                    ? 'text-ink-faint cursor-not-allowed'
                    : 'text-ink-soft hover:bg-paper-warm data-[focus]:bg-paper-warm',
                  active && 'text-ink font-medium',
                )}
              >
                <span>{r.country_name}</span>
                <span className="flex items-center gap-1.5 text-2xs text-ink-muted shrink-0">
                  {/* USD cuma fallback generik buat 193 negara lain — nulisnya di tiap
                      baris jadi berulang-ulang tanpa informasi baru. 4 negara yang benar-benar
                      punya currency sendiri (IDR/AUD/INR/PHP) tetap ditampilkan. */}
                  {r.currency !== 'USD' && r.currency}
                  {active && <Check size={13} strokeWidth={2.4} className="text-ink" />}
                </span>
              </button>
            </MenuItem>
          )
        })}

        <p className="px-3 pt-2.5 pb-1 text-2xs leading-snug text-ink-faint border-t border-line mt-1.5 sticky bottom-0 bg-paper">
          Prices shown for reference — you'll be charged in IDR at checkout.
        </p>
      </MenuItems>
    </Menu>
  )
}
