import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Store } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminVendors, useSaveAdminVendor, useDeleteAdminVendor } from '../../hooks/useAdmin'
import { Input, Textarea, Select, Badge, Modal, Button, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'

const STATUS_BADGE = {
  active: { label: 'Aktif', variant: 'success' },
  inactive: { label: 'Nonaktif', variant: 'neutral' },
  suspended: { label: 'Suspend', variant: 'danger' },
}

const EMPTY_CREATE = {
  name: '',
  slug: '',
  logo: '',
  description: '',
  email: '',
  phone: '',
  commission_rate: 0,
  status: 'active',
  admin_password: '',
}

const EMPTY_EDIT = {
  name: '',
  slug: '',
  logo: '',
  description: '',
  email: '',
  phone: '',
  commission_rate: 0,
  status: 'active',
}

export default function AdminVendorsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(search && { search }), ...(status && { status }) }), [page, search, status])

  const { data, isLoading } = useAdminVendors(params)
  const save = useSaveAdminVendor()
  const del = useDeleteAdminVendor()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_CREATE)
  const [errors, setErrors] = useState({})

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_CREATE)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (v) => {
    setEditing(v.id)
    setForm({ ...EMPTY_EDIT, ...v, commission_rate: v.commission_rate || 0 })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    setErrors({})
    try {
      await save.mutateAsync({
        id: editing,
        ...form,
        commission_rate: Number(form.commission_rate) || 0,
      })
      toast.success(editing ? 'Vendor diperbarui' : 'Vendor & akun admin dibuat')
      setModalOpen(false)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const map = {}
        Object.entries(apiErrors).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v[0] : v))
        setErrors(map)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  const handleDelete = async (v) => {
    if (!confirm(`Hapus vendor "${v.name}"? Akun vendor_admin terkait juga akan terdampak.`)) return
    try {
      await del.mutateAsync(v.id)
      toast.success('Vendor dihapus')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Vendors</h2>
          <p className="text-sm text-ink-muted mt-1">Kelola vendor. Saat tambah, akun vendor_admin otomatis dibuat.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Tambah Vendor</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari nama atau slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-48">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="suspended">Suspend</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<Store size={40} strokeWidth={1.2} />} title="Belum ada vendor" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((v) => {
              const badge = STATUS_BADGE[v.status] || { label: v.status, variant: 'neutral' }
              return (
                <li key={v.id} className="p-4 md:px-5 flex items-center gap-4">
                  <div className="h-12 w-12 bg-paper-warm rounded-pill overflow-hidden shrink-0">
                    {v.logo && <img src={v.logo} alt={v.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{v.name}</p>
                    <p className="text-xs text-ink-muted tabular-nums">{v.slug} · {v.products_count} produk · komisi {v.commission_rate}%</p>
                  </div>
                  <div><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(v)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination currentPage={data.meta.current_page} totalPages={data.meta.last_page} onPageChange={setPage} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Vendor' : 'Tambah Vendor'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} loading={save.isPending}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nama Vendor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </div>
          <Input label="Slug (opsional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="dibuat otomatis" error={errors.slug} />
          <Input label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." error={errors.logo} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint={editing ? null : 'Akan dipakai untuk akun vendor_admin'} error={errors.email} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
          <Input label="Commission Rate (%)" type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} error={errors.commission_rate} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} error={errors.status}>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="suspended">Suspend</option>
          </Select>
          {!editing && (
            <div className="sm:col-span-2">
              <Input
                label="Password Akun Vendor Admin"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                hint="Berikan ke pemilik vendor saat onboarding"
                error={errors.admin_password}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Textarea label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} error={errors.description} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
