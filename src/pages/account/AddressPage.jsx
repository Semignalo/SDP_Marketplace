import { useState } from 'react'
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAddresses, useSaveAddress, useDeleteAddress } from '../../hooks/useAccount'
import { extractErrorMessage } from '../../lib/api'
import { Button, Card, Input, Modal, Badge, EmptyState, Spinner } from '../../components/ui'
import CitySearchInput from '../../components/CitySearchInput'

const EMPTY_FORM = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address: '',
  city: '',
  city_id: null,
  country: 'Indonesia',
  postal_code: '',
  is_default: false,
}

function isInternational(addr) {
  return !!addr && (addr.country || 'Indonesia').trim().toLowerCase() !== 'indonesia'
}


export default function AddressPage() {
  const { data: addresses = [], isLoading } = useAddresses()
  const saveAddress = useSaveAddress()
  const deleteAddress = useDeleteAddress()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, is_default: addresses.length === 0 })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (addr) => {
    setEditing(addr.id)
    setForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      city_id: addr.city_id || null,
      country: addr.country || 'Indonesia',
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await saveAddress.mutateAsync({ id: editing, ...form })
      toast.success(editing ? 'Address updated' : 'Address added')
      setModalOpen(false)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const e = {}
        Object.entries(apiErrors).forEach(([k, v]) => (e[k] = Array.isArray(v) ? v[0] : v))
        setErrors(e)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAddress.mutateAsync(deleteTarget)
      toast.success('Address deleted')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Your Addresses</h2>
          <p className="text-sm text-ink-muted mt-1">Manage your shipping addresses.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add</Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} strokeWidth={1.2} />}
          title="No addresses yet."
          description="Add one now — checkout's faster when it's ready to go."
          action={<Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add address</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card as="li" key={addr.id} padding="md">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{addr.label}</Badge>
                  {addr.is_default && <Badge variant="ink">Default</Badge>}
                  {isInternational(addr) && <Badge variant="warning">International</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(addr)}
                    aria-label={`Edit address: ${addr.label}`}
                    className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(addr.id)}
                    aria-label={`Delete address: ${addr.label}`}
                    className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-ink">{addr.recipient_name}</p>
              <p className="text-xs text-ink-muted mt-0.5">{addr.phone}</p>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                {addr.address}, {addr.city} {addr.postal_code}
              </p>
            </Card>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Address' : 'Add Address'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveAddress.isPending}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home/Office" error={errors.label} />
          <Input label="Recipient Name" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} error={errors.recipient_name} />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62..." error={errors.phone} />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value, city_id: isInternational({ country: e.target.value }) ? null : form.city_id })}
            error={errors.country}
          />
          {isInternational(form) ? (
            <Input label="City / State" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
          ) : (
            <CitySearchInput
              value={form.city}
              cityId={form.city_id}
              onChange={({ name, id }) => setForm({ ...form, city: name, city_id: id })}
              error={errors.city}
            />
          )}
          <div className="sm:col-span-2">
            <Input label="Address Details" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street name, house number, RT/RW" error={errors.address} />
          </div>
          <Input label="Postal Code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} error={errors.postal_code} />
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer h-11">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              <span className="text-sm text-ink-soft">Set as default address</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this address?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteAddress.isPending}>Yes, delete</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">This address will be removed. This can't be undone.</p>
      </Modal>
    </div>
  )
}
