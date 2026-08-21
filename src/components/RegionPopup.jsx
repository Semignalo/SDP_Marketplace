import { useEffect, useState } from 'react'
import { useCurrencyStore } from '../stores/useCurrencyStore'
import { useRegionContext, useCountryOptions } from '../hooks/useRegion'
import { Modal, Button, Select } from './ui'

const DISMISS_KEY = 'sdp-region-prompt-dismissed'

/**
 * Konfirmasi region di kunjungan pertama. Harga sudah otomatis mengikuti hasil
 * deteksi IP sebelum modal ini muncul — jadi ini konfirmasi + jalan keluar cepat
 * kalau deteksinya meleset, bukan gerbang wajib (bisa ditutup lewat X tanpa memilih apa-apa).
 *
 * Sengaja judulnya "Confirm your country", bukan "confirm where you're shipping to" —
 * dropdown ini murni soal tampilan harga/currency, sama sekali tidak membatasi atau
 * menentukan kemana barang bisa dikirim (lihat RegionSwitcher untuk alasan yang sama).
 */
export default function RegionPopup() {
  const { data } = useRegionContext()
  const { localized, others } = useCountryOptions()
  const source = useCurrencyStore((s) => s.source)
  const setRegion = useCurrencyStore((s) => s.setRegion)
  const [dismissed, setDismissed] = useState(true)
  const [selected, setSelected] = useState(null)

  const detected = data?.detected
  // Kode mentah hasil geo-IP, BUKAN detected.country_code — itu sudah dipaksa jadi 'ID'
  // kalau negaranya belum dilokalkan (lihat GeoLocationService::resolve). Popup ini harus
  // tetap muncul untuk SEMUA negara asing, bukan cuma yang 4 (AU/IN/PH) sudah dapat currency sendiri.
  const detectedRaw = detected?.detected_country

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Default pilihan dropdown = hasil deteksi mentah, terlepas dari didukung atau tidak.
  useEffect(() => {
    if (detectedRaw) setSelected(detectedRaw)
  }, [detectedRaw])

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  // Muncul untuk negara asing manapun yang berhasil dideteksi (bukan cuma yang 4 sudah
  // dilokalkan) — dan user belum pernah memilih region sendiri. Pengunjung domestik
  // (mayoritas) tidak pernah lihat ini karena detectedRaw-nya 'ID'.
  const shouldShow = !dismissed && detectedRaw && detectedRaw !== 'ID' && source !== 'manual'
  if (!shouldShow) return null

  // List datar, urut abjad — tanpa grup/badge apapun. Status ready-stock tetap ada
  // di data (dipakai RegionSwitcher di navbar), sengaja tidak ditampilkan di sini.
  const allOptions = [...localized, ...others].sort((a, b) => a.country_name.localeCompare(b.country_name))
  const selectedRegion = allOptions.find((r) => r.country_code === selected)

  const handleConfirm = () => {
    if (selectedRegion) {
      setRegion({
        country: selectedRegion.country_code,
        currency: selectedRegion.currency,
        locale: selectedRegion.locale,
      })
    }
    close()
  }

  return (
    <Modal open onClose={close} title="Confirm your country" size="sm">
      <div className="space-y-4">
        <Select
          label="Shopping from"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value)}
        >
          {allOptions.map((r) => {
            const disabled = r.currency !== 'IDR' && r.currency !== 'USD' && !r.rate_to_idr
            return (
              <option key={r.country_code} value={r.country_code} disabled={disabled}>
                {r.country_name}
              </option>
            )
          })}
        </Select>

        <p className="text-2xs leading-relaxed text-ink-muted">
          Prices shown for reference — you'll be charged in IDR at checkout.
        </p>

        <Button onClick={handleConfirm} fullWidth>
          Confirm
        </Button>
      </div>
    </Modal>
  )
}
