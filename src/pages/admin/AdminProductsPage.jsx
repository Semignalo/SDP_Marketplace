import { useMemo, useState } from 'react'
import { Search, Trash2, Package, ExternalLink, Plus, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAdminProducts, useCreateAdminProduct, useUpdateAdminProduct,
  useUpdateAdminProductStatus, useDeleteAdminProduct, useAdminVendors,
} from '../../hooks/useAdmin'
import { useCategories } from '../../hooks/useProducts'
import { Input, Select, Pagination, Skeleton, EmptyState, Button, Textarea, Modal } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, cn } from '../../lib/utils'
import ImagesEditor from '../../components/ImagesEditor'

const STATUS_BADGE = {
  active: { label: 'Aktif', variant: 'success' },
  draft:  { label: 'Draft', variant: 'warning' },
  archived: { label: 'Arsip', variant: 'neutral' },
}

const EMPTY_FORM = {
  vendor_id: '', name: '', slug: '', category_id: '', description: '',
  price: '', compare_at_price: '', stock: '', sku: '', status: 'active', images: [],
}

export default function AdminProductsPage() {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [vendorId, setVendorId] = useState('')
  const [page, setPage]       = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const params = useMemo(() => ({
    page,
    ...(search   && { search }),
    ...(status   && { status }),
    ...(vendorId && { vendor_id: vendorId }),
  }), [page, search, status, vendorId])

  const { data, isLoading }   = useAdminProducts(params)
  const { data: vendors }     = useAdminVendors({ per_page: 100 })
  const { data: catData }     = useCategories()
  const createProduct         = useCreateAdminProduct()
  const updateProduct         = useUpdateAdminProduct()
  const updateStatus          = useUpdateAdminProductStatus()
  const del                   = useDeleteAdminProduct()

  const flatCategories = useMemo(() => flatten(catData || []), [catData])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      vendor_id:   String(p.vendor?.id || ''),
      name:        p.name || '',
      slug:        p.slug || '',
      category_id: String(p.category?.id || ''),
      description: p.description || '',
      price:       String(p.price || ''),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      stock:       String(p.stock ?? ''),
      sku:         p.sku || '',
      status:      p.status || 'active',
      images:      (p.images || []).map((im) => im.url),
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrors({})
    const payload = {
      vendor_id:   Number(form.vendor_id),
      name:        form.name,
      slug:        form.slug || undefined,
      category_id: Number(form.category_id),
      description: form.description || undefined,
      price:       Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock:       Number(form.stock),
      sku:         form.sku || undefined,
      status:      form.status,
      images:      form.images.filter(Boolean),
    }
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...payload })
        toast.success('Produk diperbarui')
      } else {
        await createProduct.mutateAsync(payload)
        toast.success('Produk ditambahkan')
      }
      setModalOpen(false)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      toast.error(extractErrorMessage(err))
    }
  }

  const handleStatusChange = async (p, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id: p.id, status: newStatus })
      toast.success(`Status diubah ke ${newStatus}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await del.mutateAsync(deleteTarget.id)
      toast.success('Produk dihapus')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleteTarget(null)
    }
  }

  const isSaving = createProduct.isPending || updateProduct.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Produk (Cross-Vendor)</h2>
          <p className="text-sm text-ink-muted mt-1">Kelola semua produk dari semua vendor.</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus size={14} /> Tambah Produk
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Input
          placeholder="Cari nama atau SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          leadingIcon={<Search size={14} />}
        />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="draft">Draft</option>
          <option value="archived">Arsip</option>
        </Select>
        <Select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1) }}>
          <option value="">Semua vendor</option>
          {vendors?.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[50px_1.8fr_1fr_100px_80px_140px_100px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span></span><span>Produk</span><span>Vendor</span>
          <span className="text-right">Harga</span><span className="text-right">Stok</span>
          <span>Status</span><span className="text-right">Aksi</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<Package size={40} strokeWidth={1.2} />} title="Tidak ada produk" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((p) => {
              const badge = STATUS_BADGE[p.status] || { label: p.status, variant: 'neutral' }
              const img = p.primary_image || p.images?.[0]?.url
              return (
                <li key={p.id} className="p-4 md:px-5 md:grid md:grid-cols-[50px_1.8fr_1fr_100px_80px_140px_100px] md:gap-4 md:items-center">
                  <div className="h-12 w-12 bg-paper-warm rounded overflow-hidden shrink-0">
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 mt-2 md:mt-0">
                    <Link to={`/products/${p.slug}`} target="_blank" className="text-sm text-ink line-clamp-1 font-medium hover:underline inline-flex items-center gap-1">
                      {p.name} <ExternalLink size={11} className="opacity-50" />
                    </Link>
                    <p className="text-xs text-ink-muted mt-0.5">{p.category?.name || '—'}{p.sku && ` · ${p.sku}`}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-1 md:mt-0">{p.vendor?.name || '—'}</p>
                  <p className="text-sm md:text-right font-semibold tabular-nums mt-1 md:mt-0">{formatRupiah(p.price)}</p>
                  <p className={cn('text-sm md:text-right tabular-nums mt-1 md:mt-0', p.stock < 5 && 'text-state-danger font-semibold')}>{p.stock}</p>
                  <div className="mt-2 md:mt-0">
                    <Select value={p.status} onChange={(e) => handleStatusChange(p, e.target.value)} className="h-8 text-xs">
                      <option value="active">Aktif</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Arsip</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit produk: ${p.name}`}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Hapus produk: ${p.name}`}
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

      {/* Modal Tambah/Edit Produk */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Produk' : 'Tambah Produk'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Vendor */}
            <div className="sm:col-span-2">
              <Select label="Vendor *" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} required error={errors.vendor_id?.[0]}>
                <option value="">Pilih vendor...</option>
                {vendors?.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>

            {/* Nama */}
            <div className="sm:col-span-2">
              <Input label="Nama Produk *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" required error={errors.name?.[0]} />
            </div>

            {/* Kategori */}
            <Select label="Kategori *" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required error={errors.category_id?.[0]}>
              <option value="">Pilih kategori...</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>{' '.repeat(c.depth * 3)}{c.name}</option>
              ))}
            </Select>

            {/* Status */}
            <Select label="Status *" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="archived">Arsip</option>
            </Select>

            {/* Harga */}
            <Input label="Harga *" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" required error={errors.price?.[0]} />

            {/* Harga Coret (diskon) */}
            <Input label="Harga Coret" type="number" min="0" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} placeholder="Opsional, harus lebih besar dari harga" error={errors.compare_at_price?.[0]} />

            {/* Stok */}
            <Input label="Stok *" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" required error={errors.stock?.[0]} />

            {/* SKU */}
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Opsional" />

            {/* Slug */}
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generate jika kosong" />

            {/* Deskripsi */}
            <div className="sm:col-span-2">
              <Textarea label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Deskripsi produk..." />
            </div>

            {/* Images */}
            <div className="sm:col-span-2">
              <ImagesEditor images={form.images} onChange={(images) => setForm({ ...form, images })} error={errors['images.0']} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus produk ini?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={del.isPending}>Ya, hapus</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Produk <span className="font-semibold text-ink">{deleteTarget?.name}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  )
}


function flatten(categories, depth = 0) {
  const result = []
  categories.forEach((c) => {
    result.push({ id: c.id, name: c.name, depth })
    if (c.children?.length) result.push(...flatten(c.children, depth + 1))
  })
  return result
}
