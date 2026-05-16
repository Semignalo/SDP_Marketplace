import { useState } from 'react'
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAddresses, useSaveAddress, useDeleteAddress } from '../../hooks/useAccount'
import { extractErrorMessage } from '../../lib/api'
import { Button, Input, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const EMPTY_FORM = {
  label: 'Rumah',
  recipient_name: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  is_default: false,
}

export default function AddressPage() {
  const { data: addresses = [], isLoading } = useAddresses()
  const saveAddress = useSaveAddress()
  const deleteAddress = useDeleteAddress()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

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
      toast.success(editing ? 'Alamat diperbarui' : 'Alamat ditambahkan')
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

  const handleDelete = async (id) => {
    if (!confirm('Hapus alamat ini?')) return
    try {
      await deleteAddress.mutateAsync(id)
      toast.success('Alamat dihapus')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Daftar Alamat</h2>
          <p className="text-sm text-ink-muted mt-1">Kelola alamat pengiriman kamu.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Tambah</Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} strokeWidth={1.2} />}
          title="Belum ada alamat"
          description="Tambahkan alamat untuk mempercepat proses checkout."
          action={<Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Tambah Alamat</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <li key={addr.id} className="border border-line rounded-lg p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{addr.label}</Badge>
                  {addr.is_default && <Badge variant="ink">Utama</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(addr)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-ink">{addr.recipient_name}</p>
              <p className="text-xs text-ink-muted mt-0.5">{addr.phone}</p>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                {addr.address}, {addr.city} {addr.postal_code}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Alamat' : 'Tambah Alamat'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} loading={saveAddress.isPending}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Rumah/Kantor" error={errors.label} />
          <Input label="Nama Penerima" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} error={errors.recipient_name} />
          <Input label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62..." error={errors.phone} />
          <Input label="Kota" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
          <div className="sm:col-span-2">
            <Input label="Alamat Lengkap" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jalan, RT/RW, kelurahan, kecamatan" error={errors.address} />
          </div>
          <Input label="Kode Pos" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} error={errors.postal_code} />
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer h-11">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              <span className="text-sm text-ink-soft">Jadikan alamat utama</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
