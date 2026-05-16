import { useMemo, useState } from 'react'
import { Search, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser, useAdminVendors } from '../../hooks/useAdmin'
import { Input, Select, Badge, Modal, Button, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatDate } from '../../lib/utils'

const ROLE_BADGE = {
  customer: { label: 'Customer', variant: 'neutral' },
  vendor_admin: { label: 'Vendor', variant: 'warning' },
  admin: { label: 'Admin', variant: 'success' },
}

const EMPTY_EDIT = { name: '', role: 'customer', vendor_id: '', phone: '', password: '' }

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(search && { search }), ...(role && { role }) }), [page, search, role])

  const { data, isLoading } = useAdminUsers(params)
  const { data: vendors } = useAdminVendors({ per_page: 100 })
  const update = useUpdateAdminUser()
  const del = useDeleteAdminUser()

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_EDIT)
  const [errors, setErrors] = useState({})

  const openEdit = (u) => {
    setEditing(u)
    setForm({
      name: u.name || '',
      role: u.role,
      vendor_id: u.vendor_id || '',
      phone: u.phone || '',
      password: '',
    })
    setErrors({})
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    setErrors({})
    try {
      await update.mutateAsync({
        id: editing.id,
        ...form,
        vendor_id: form.role === 'vendor_admin' ? Number(form.vendor_id) || null : null,
        password: form.password || undefined,
      })
      toast.success('User diperbarui')
      setEditing(null)
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

  const handleDelete = async (u) => {
    if (!confirm(`Hapus user "${u.name}" (${u.email})?`)) return
    try {
      await del.mutateAsync(u.id)
      toast.success('User dihapus')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Users</h2>
        <p className="text-sm text-ink-muted mt-1">Kelola semua akun: customer, vendor admin, admin.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="md:w-48">
          <option value="">Semua role</option>
          <option value="customer">Customer</option>
          <option value="vendor_admin">Vendor Admin</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.6fr_1fr_120px_1fr_100px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
          <span>User</span>
          <span>Role</span>
          <span>Vendor</span>
          <span>Daftar</span>
          <span className="text-right">Aksi</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<Users size={40} strokeWidth={1.2} />} title="Tidak ada user" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((u) => {
              const badge = ROLE_BADGE[u.role] || { label: u.role, variant: 'neutral' }
              return (
                <li key={u.id} className="p-4 md:px-5 md:grid md:grid-cols-[1.6fr_1fr_120px_1fr_100px] md:gap-4 md:items-center">
                  <div>
                    <p className="text-sm text-ink font-medium">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                    {u.reseller_code && <p className="text-2xs text-ink-faint tabular-nums mt-0.5">Code: {u.reseller_code}</p>}
                  </div>
                  <div className="mt-2 md:mt-0"><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <p className="text-xs text-ink-muted mt-1 md:mt-0">{u.vendor?.name || '—'}</p>
                  <p className="text-xs text-ink-muted mt-1 md:mt-0 tabular-nums">{formatDate(u.created_at)}</p>
                  <div className="flex items-center gap-1 mt-3 md:mt-0 md:justify-end">
                    <button onClick={() => openEdit(u)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(u)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded">
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
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit User: ${editing?.name || ''}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={handleSave} loading={update.isPending}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />

          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} error={errors.role}>
            <option value="customer">Customer</option>
            <option value="vendor_admin">Vendor Admin</option>
            <option value="admin">Admin</option>
          </Select>

          {form.role === 'vendor_admin' && (
            <Select label="Vendor" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} error={errors.vendor_id}>
              <option value="">Pilih vendor</option>
              {vendors?.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}

          <div className={form.role === 'vendor_admin' ? 'sm:col-span-2' : 'sm:col-span-2'}>
            <Input label="Password Baru (opsional)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Kosongkan jika tidak diubah" error={errors.password} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
