import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { COUNTRIES } from '../lib/countries'
import { useRegionalStocks, useSaveRegionalStocks } from '../hooks/useRegionalStocks'
import { extractErrorMessage } from '../lib/api'
import { Modal, Button, Input, Select, Spinner } from './ui'

/**
 * Editor alokasi stok per negara, dipakai panel admin maupun vendor (`scope`).
 *
 * Beda dari RegionalPriceEditor: daftar negara di sini TERBUKA (bisa negara manapun
 * dari daftar dunia), bukan fixed 3 negara — jadi ada picker "add a country" +
 * tombol hapus per baris, bukan list fixed yang selalu tampil semua.
 *
 * Negara yang TIDAK ada di sini otomatis ikut stock global produk, tanpa batas.
 */
export default function RegionalStockEditor({ open, onClose, scope, product }) {
  const productId = product?.id
  const { data: rows, isLoading } = useRegionalStocks(scope, open ? productId : null)
  const save = useSaveRegionalStocks(scope)
  const [draft, setDraft] = useState([])
  const [pickerValue, setPickerValue] = useState('')

  useEffect(() => {
    if (!rows) return
    setDraft(
      rows.map((r) => ({
        country_code: r.country_code,
        country_name: r.country_name,
        qty: String(r.allocated_qty),
        remaining_qty: r.remaining_qty,
        consumed_qty: r.consumed_qty,
      })),
    )
  }, [rows])

  const usedCodes = new Set(draft.map((d) => d.country_code))
  const pickerOptions = COUNTRIES.filter((c) => !usedCodes.has(c.code))

  const addRow = () => {
    const country = COUNTRIES.find((c) => c.code === pickerValue)
    if (!country) return
    setDraft((d) => [...d, { country_code: country.code, country_name: country.name, qty: '0', remaining_qty: null, consumed_qty: 0 }])
    setPickerValue('')
  }

  const removeRow = (code) => {
    const row = draft.find((d) => d.country_code === code)
    if (row?.consumed_qty > 0) {
      const ok = window.confirm(
        `${row.consumed_qty} unit already sold from this country's pool. Removing it means any future cancellation of those orders will restore to general stock instead. Continue?`,
      )
      if (!ok) return
    }
    setDraft((d) => d.filter((r) => r.country_code !== code))
  }

  const setQty = (code, qty) =>
    setDraft((d) => d.map((r) => (r.country_code === code ? { ...r, qty } : r)))

  const handleSave = async () => {
    // Baris yang ada di server tapi sudah dihapus dari draft harus dikirim eksplisit
    // dengan qty: null — server tidak menghapus negara yang tidak disebut sama sekali.
    const removedCodes = (rows ?? [])
      .map((r) => r.country_code)
      .filter((code) => !draft.some((d) => d.country_code === code))

    const stocks = [
      ...draft.map((r) => ({ country_code: r.country_code, qty: Number(r.qty) || 0 })),
      ...removedCodes.map((code) => ({ country_code: code, qty: null })),
    ]

    try {
      await save.mutateAsync({ productId, stocks })
      toast.success('Regional stock updated')
      onClose()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Regional stock"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={save.isPending} disabled={isLoading}>
            Save stock
          </Button>
        </div>
      }
    >
      <p className="text-2xs leading-relaxed text-ink-muted mb-4">
        Give <span className="font-medium text-ink">{product?.name}</span> a separate stock pool
        for specific countries. Countries not listed here use the product's global stock
        ({product?.stock}) with no limit. Orders from a listed country draw from that
        country's pool independently — the global stock number never changes because of this.
      </p>

      <div className="flex gap-2 mb-4">
        <Select
          value={pickerValue}
          onChange={(e) => setPickerValue(e.target.value)}
          placeholder="Add a country…"
          options={pickerOptions.map((c) => ({ value: c.code, label: c.name }))}
          className="h-9"
        />
        <Button variant="outline" size="sm" onClick={addRow} disabled={!pickerValue} leadingIcon={<Plus size={14} />}>
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {draft.map((r) => (
            <div key={r.country_code} className="flex items-center gap-3 p-3 rounded border border-line bg-paper-soft">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{r.country_name}</p>
                {r.remaining_qty !== null && (
                  <p className="text-2xs text-ink-muted tabular-nums">{r.remaining_qty} left · {r.consumed_qty} sold from this pool</p>
                )}
              </div>
              <Input
                type="number"
                min="0"
                step="1"
                value={r.qty}
                onChange={(e) => setQty(r.country_code, e.target.value)}
                className="h-9 w-24"
              />
              <button
                type="button"
                onClick={() => removeRow(r.country_code)}
                className="text-ink-muted hover:text-state-danger p-2"
                aria-label={`Remove ${r.country_name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {draft.length === 0 && (
            <p className="text-sm text-ink-muted py-4 text-center">No country-specific stock yet — add one above.</p>
          )}
        </div>
      )}
    </Modal>
  )
}
