import { useState } from 'react'
import { Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminShippingRates, useSaveAdminShippingRate, useDeleteAdminShippingRate,
} from '../../hooks/useAdmin'
import { Input, Select, Textarea, Modal, Button, Skeleton, EmptyState, Badge } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, cn } from '../../lib/utils'
import { COUNTRIES } from '../../lib/countries'

const EMPTY = {
  country: '',
  country_code: '',
  zone: '',
  // 999kg = "berlaku untuk berat berapapun" — default buat flat rate (belum ada data bertingkat).
  weight_kg: '999',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  service: 'BASIC',
  term: 'DDU',
  base_rate: '',
  fsc_percent: '0',
  esc_amount: '0',
  add_fee_custom: '0',
  notes: '',
  is_active: true,
}

export default function AdminShippingRatesPage() {
  const { data: rates = [], isLoading } = useAdminShippingRates()
  const save = useSaveAdminShippingRate()
  const del = useDeleteAdminShippingRate()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({
      country: r.country,
      country_code: r.country_code || '',
      zone: r.zone || '',
      weight_kg: String(r.weight_kg),
      length_cm: r.length_cm != null ? String(r.length_cm) : '',
      width_cm: r.width_cm != null ? String(r.width_cm) : '',
      height_cm: r.height_cm != null ? String(r.height_cm) : '',
      service: r.service,
      term: r.term,
      base_rate: String(r.base_rate),
      fsc_percent: String(r.fsc_percent),
      esc_amount: String(r.esc_amount),
      add_fee_custom: String(r.add_fee_custom),
      notes: r.notes || '',
      is_active: r.is_active,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    setErrors({})
    try {
      await save.mutateAsync({
        id: editing,
        country: form.country,
        country_code: form.country_code || null,
        zone: form.zone || null,
        weight_kg: Number(form.weight_kg),
        length_cm: form.length_cm ? Number(form.length_cm) : null,
        width_cm: form.width_cm ? Number(form.width_cm) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        service: form.service,
        term: form.term,
        base_rate: Number(form.base_rate),
        fsc_percent: Number(form.fsc_percent) || 0,
        esc_amount: Number(form.esc_amount) || 0,
        add_fee_custom: Number(form.add_fee_custom) || 0,
        notes: form.notes || null,
        is_active: form.is_active,
      })
      toast.success(editing ? 'Shipping rate updated' : 'Shipping rate added')
      setModalOpen(false)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const map = {}
        Object.entries(apiErrors).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v[0] : v))
        setErrors(map)
      }
      toast.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await del.mutateAsync(deleteTarget.id)
      toast.success('Shipping rate deleted')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Shipping Rates</h2>
          <p className="text-sm text-ink-muted mt-1">
            International shipping cost per country. A country with an active rate here gets
            auto-calculated shipping at checkout — customers can pay right away instead of
            waiting for a manual quote.
          </p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add Rate</Button>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rates.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Truck size={40} strokeWidth={1.2} />}
              title="No shipping rates yet"
              description="Every international order will require a manual quote until you add rates here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs font-bold uppercase tracking-widest text-ink-muted">
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Weight tier</th>
                  <th className="px-5 py-3">Service / Term</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rates.map((r) => (
                  <tr key={r.id} className={cn('hover:bg-paper-soft', !r.is_active && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{r.country}</p>
                      {r.zone && <p className="text-2xs text-ink-muted mt-0.5">{r.zone}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft tabular-nums">
                      {r.weight_kg >= 999 ? 'Any weight' : `up to ${r.weight_kg}kg`}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{r.service} · {r.term}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatRupiah(r.final_price)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          aria-label={`Edit rate: ${r.country}`}
                          className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          aria-label={`Delete rate: ${r.country}`}
                          className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Shipping Rate' : 'Add Shipping Rate'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={save.isPending}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Country *"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              error={errors.country}
            >
              <option value="">— Select country —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </Select>
            <Input
              label="Base cost (Rp) *"
              type="number"
              min="0"
              value={form.base_rate}
              onChange={(e) => setForm({ ...form, base_rate: e.target.value })}
              placeholder="e.g. 250000"
              error={errors.base_rate}
            />
          </div>

          <div className="pt-4 border-t border-line">
            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">
              Weight tier (optional — leave as "any weight" for a flat rate)
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                label="Up to weight (kg)"
                type="number"
                min="0.01"
                step="0.01"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                hint="999 = any weight"
                error={errors.weight_kg}
              />
              <Select label="Service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                <option value="BASIC">BASIC</option>
                <option value="STANDARD">STANDARD</option>
                <option value="EXPRESS">EXPRESS</option>
              </Select>
              <Select label="Term" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                <option value="DDU">DDU</option>
                <option value="DDP">DDP</option>
                <option value="DOMESTIC">DOMESTIC (local stock)</option>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-line">
            <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">
              Additional fees (optional, added on top of base cost)
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="FSC (%)" type="number" min="0" max="100" value={form.fsc_percent} onChange={(e) => setForm({ ...form, fsc_percent: e.target.value })} />
              <Input label="ESC (Rp)" type="number" min="0" value={form.esc_amount} onChange={(e) => setForm({ ...form, esc_amount: e.target.value })} />
              <Input label="Custom fee (Rp)" type="number" min="0" value={form.add_fee_custom} onChange={(e) => setForm({ ...form, add_fee_custom: e.target.value })} />
            </div>
          </div>

          <div className="pt-4 border-t border-line grid sm:grid-cols-2 gap-4">
            <Input label="Country code (optional)" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} placeholder="e.g. AUS" maxLength={3} />
            <Input label="Zone (optional)" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="e.g. West Coast" />
            <div className="sm:col-span-2">
              <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Source of this rate, date confirmed, etc." />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-line"
            />
            <span className="text-sm text-ink">Active — used for automatic checkout quotes</span>
          </label>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this rate?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={del.isPending}>Yes, delete</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Shipping rate for <span className="font-semibold text-ink">{deleteTarget?.country}</span> will
          be deleted. Orders to that country will go back to manual quote.
        </p>
      </Modal>
    </div>
  )
}
