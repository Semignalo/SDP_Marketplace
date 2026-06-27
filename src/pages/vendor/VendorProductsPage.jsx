import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import {
  useVendorProducts,
  useSaveVendorProduct,
  useDeleteVendorProduct,
} from '../../hooks/useVendor'
import { useCategories } from '../../hooks/useProducts'
import { Button, Input, Textarea, Select, Badge, Modal, EmptyState, Pagination, Skeleton } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, cn } from '../../lib/utils'
import ImagesEditor from '../../components/ImagesEditor'

const EMPTY = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  price: '',
  stock: 0,
  sku: '',
  status: 'active',
  images: [],
}

const STATUS_BADGE = {
  active: { label: 'Active', variant: 'success' },
  draft: { label: 'Draft', variant: 'warning' },
  archived: { label: 'Archived', variant: 'neutral' },
}

export default function VendorProductsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    page,
    ...(search && { search }),
    ...(status && { status }),
  }), [page, search, status])

  const { data, isLoading } = useVendorProducts(params)
  const { data: categories = [] } = useCategories()
  const saveMut = useSaveVendorProduct()
  const deleteMut = useDeleteVendorProduct()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const flatCategories = useMemo(() => flatten(categories), [categories])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      category_id: p.category?.id || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      stock: p.stock ?? 0,
      sku: p.sku || '',
      status: p.status || 'active',
      images: (p.images || []).map((im) => im.url),
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    setErrors({})
    try {
      await saveMut.mutateAsync({
        id: editing,
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: Number(form.category_id),
        images: form.images.filter(Boolean),
      })
      toast.success(editing ? 'Product updated' : 'Product added')
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
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Product deleted')
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
          <h2 className="text-base font-semibold text-ink">Product List</h2>
          <p className="text-sm text-ink-muted mt-1">Manage your store's product catalog.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add Product</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-48">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[60px_1.6fr_120px_100px_80px_100px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span></span>
          <span>Product</span>
          <span className="text-right">Price</span>
          <span className="text-right">Stock</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Package size={40} strokeWidth={1.2} />}
              title="No products yet"
              description="Add your first product to start selling."
              action={<Button leadingIcon={<Plus size={16} />} onClick={openCreate}>Add Product</Button>}
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((p) => {
              const badge = STATUS_BADGE[p.status] || { label: p.status, variant: 'neutral' }
              const img = p.primary_image || p.images?.[0]?.url
              return (
                <li key={p.id} className="p-4 md:px-5 md:grid md:grid-cols-[60px_1.6fr_120px_100px_80px_100px] md:gap-4 md:items-center">
                  <div className="h-14 w-14 md:h-12 md:w-12 bg-paper-warm rounded overflow-hidden shrink-0 mb-3 md:mb-0">
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink line-clamp-1 font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5 tabular-nums">{p.category?.name || '—'}{p.sku && ` · ${p.sku}`}</p>
                  </div>
                  <p className="text-sm md:text-right font-semibold tabular-nums mt-2 md:mt-0">{formatRupiah(p.price)}</p>
                  <p className={cn('text-sm md:text-right tabular-nums mt-1 md:mt-0', p.stock < 5 && 'text-state-danger font-semibold')}>{p.stock}</p>
                  <div className="mt-2 md:mt-0"><Badge variant={badge.variant}>{badge.label}</Badge></div>
                  <div className="flex items-center gap-1 mt-3 md:mt-0 md:justify-end">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit product: ${p.name}`}
                      className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Delete product: ${p.name}`}
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
        <Pagination
          currentPage={data.meta.current_page}
          lastPage={data.meta.last_page}
          onChange={setPage}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveMut.isPending}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </div>
          <Input label="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated" error={errors.slug} />
          <Select label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} error={errors.category_id}>
            <option value="">Select category</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>{'— '.repeat(c.depth)}{c.name}</option>
            ))}
          </Select>

          <Input label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" error={errors.price} />
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} error={errors.stock} />

          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} error={errors.sku} />

          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} error={errors.status}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>

          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              error={errors.description}
            />
          </div>

          <div className="sm:col-span-2">
            <ImagesEditor
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              error={errors['images.0']}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this product?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMut.isPending}>Yes, delete</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{deleteTarget?.name}</span> will be permanently deleted. This action cannot be undone.
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
