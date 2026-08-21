import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRegionalPrices, useSaveRegionalPrices } from '../hooks/useRegionalPrices'
import { extractErrorMessage } from '../lib/api'
import { formatRupiah } from '../lib/utils'
import { formatCurrency } from '../hooks/useCurrency'
import { Modal, Button, Input, Spinner } from './ui'

/**
 * Editor harga per negara, dipakai panel admin maupun vendor (`scope`).
 *
 * Harga bisa diisi dalam IDR atau mata uang lokal. Yang diisi dalam mata uang lokal
 * dikonversi sekali saat disimpan lalu dibekukan sebagai IDR — jadi harga tidak ikut
 * bergerak tiap kurs berubah, dan penagihan tetap IDR seperti order lainnya.
 */
export default function RegionalPriceEditor({ open, onClose, scope, product }) {
  const productId = product?.id
  const { data: rows, isLoading } = useRegionalPrices(scope, open ? productId : null)
  const save = useSaveRegionalPrices(scope)
  const [draft, setDraft] = useState({})

  // Isi form dari server tiap kali modal dibuka untuk produk lain.
  useEffect(() => {
    if (!rows) return
    setDraft(
      Object.fromEntries(
        rows.map((r) => [
          r.country_code,
          {
            mode: r.input_currency ? 'native' : 'idr',
            amount: r.has_override
              ? String(r.input_currency ? r.input_amount : r.price_idr)
              : '',
          },
        ]),
      ),
    )
  }, [rows])

  const setField = (code, patch) =>
    setDraft((d) => ({ ...d, [code]: { ...d[code], ...patch } }))

  const handleSave = async () => {
    const prices = (rows ?? []).map((r) => {
      const entry = draft[r.country_code] ?? {}
      const raw = String(entry.amount ?? '').trim()

      return {
        country_code: r.country_code,
        // Kosong = hapus override, produk kembali ke harga dasar.
        amount: raw === '' ? null : Number(raw),
        mode: entry.mode ?? 'idr',
      }
    })

    try {
      await save.mutateAsync({ productId, prices })
      toast.success('Regional prices updated')
      onClose()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Regional prices"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={save.isPending} disabled={isLoading}>
            Save prices
          </Button>
        </div>
      }
    >
      <p className="text-2xs leading-relaxed text-ink-muted mb-4">
        Set a different price per country for{' '}
        <span className="font-medium text-ink">{product?.name}</span>. Base price is{' '}
        <span className="font-medium text-ink tabular-nums">{formatRupiah(product?.price)}</span>.
        Leave a field blank to use the base price. Customers are always charged in IDR.
      </p>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {(rows ?? []).map((r) => {
            const entry = draft[r.country_code] ?? { mode: 'idr', amount: '' }
            const isNative = entry.mode === 'native'
            const amount = Number(entry.amount)
            const hasAmount = String(entry.amount ?? '').trim() !== '' && !Number.isNaN(amount)

            // Pratinjau langsung: berapa jadinya di sisi satunya.
            const previewIdr = isNative && r.rate_to_idr ? amount * r.rate_to_idr : amount
            const previewNative = r.rate_to_idr ? previewIdr / r.rate_to_idr : null

            return (
              <div
                key={r.country_code}
                className="grid sm:grid-cols-[9rem_1fr] gap-2 sm:gap-3 sm:items-start p-3 rounded border border-line bg-paper-soft"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{r.country_name}</p>
                  <p className="text-2xs text-ink-muted tabular-nums">
                    {r.rate_to_idr
                      ? `1 ${r.currency} = ${formatRupiah(r.rate_to_idr)}`
                      : `${r.currency} rate unavailable`}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="inline-flex rounded border border-line bg-paper p-0.5 shrink-0">
                      {['idr', 'native'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          // Tanpa kurs, input native tidak bisa dikonversi — server akan menolak.
                          disabled={m === 'native' && !r.rate_to_idr}
                          onClick={() => setField(r.country_code, { mode: m })}
                          className={
                            'h-8 px-2.5 rounded text-2xs font-bold tracking-wide transition ' +
                            (entry.mode === m
                              ? 'bg-ink text-white'
                              : 'text-ink-muted hover:text-ink disabled:text-ink-faint disabled:cursor-not-allowed')
                          }
                        >
                          {m === 'idr' ? 'IDR' : r.currency}
                        </button>
                      ))}
                    </div>

                    <Input
                      type="number"
                      min="0"
                      step={isNative ? '0.01' : '1'}
                      value={entry.amount ?? ''}
                      onChange={(e) => setField(r.country_code, { amount: e.target.value })}
                      placeholder={r.has_override ? '' : 'Base price'}
                      className="h-9"
                    />
                  </div>

                  {hasAmount && (
                    <p className="text-2xs text-ink-muted tabular-nums">
                      {isNative
                        ? `≈ ${formatRupiah(previewIdr)} charged`
                        : previewNative !== null
                          ? `≈ ${formatCurrency(previewNative, r.currency)} shown to customer`
                          : null}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
