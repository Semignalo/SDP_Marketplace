import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Store } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminVendors, useSaveAdminVendor, useDeleteAdminVendor } from '../../hooks/useAdmin'
import { Input, Textarea, Select, Badge, Modal, Button, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'

const STATUS_BADGE = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  suspended: { label: 'Suspended', variant: 'danger' },
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
  const [deleteTarget, setDeleteTarget] = useState(null)

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
      toast.success(editing ? 'Vendor updated' : 'Vendor and admin account created')
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await del.mutateAsync(deleteTarget.id)
      toast.success('Vendor deleted')
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
          <h2 className="text-base font-semibold text-ink">Vendors</h2>
          <p className="text-sm text-ink-muted mt-1">Manage vendors. Adding one automatically creates a vendor_admin account.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add Vendor</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search name or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-48">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<Store size={40} strokeWidth={1.2} />} title="No vendors yet" /></div>
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
                    <p className="text-xs text-ink-muted tabular-nums">{v.slug} · {v.products_count} products · {v.commission_rate}% commission</p>
                  </div>
                  <div><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      aria-label={`Edit vendor: ${v.name}`}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(v)}
                      aria-label={`Delete vendor: ${v.name}`}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded"
                    >
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
        <Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Vendor' : 'Add Vendor'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={save.isPending}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </div>
          <Input label="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated" error={errors.slug} />
          <Input label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." error={errors.logo} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint={editing ? null : 'Will be used for the vendor_admin account'} error={errors.email} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
          <Input label="Commission Rate (%)" type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} error={errors.commission_rate} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} error={errors.status}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
          {!editing && (
            <div className="sm:col-span-2">
              <Input
                label="Vendor Admin Account Password"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                hint="Give this to the vendor owner during onboarding"
                error={errors.admin_password}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} error={errors.description} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this vendor?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={del.isPending}>Yes, delete</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{deleteTarget?.name}</span> will be deleted. The related vendor_admin account will also be affected. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
