import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, FolderTree, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminCategories, useSaveAdminCategory, useDeleteAdminCategory } from '../../hooks/useAdmin'
import { Input, Select, Modal, Button, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'

const EMPTY = { name: '', slug: '', parent_id: '', sort_order: 0 }

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories()
  const save = useSaveAdminCategory()
  const del = useDeleteAdminCategory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const tree = useMemo(() => buildTree(categories), [categories])
  const flat = useMemo(() => flatten(tree), [tree])

  const openCreate = (parentId = null) => {
    setEditing(null)
    setForm({ ...EMPTY, parent_id: parentId || '' })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id || '',
      sort_order: c.sort_order || 0,
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
        name: form.name,
        slug: form.slug || undefined,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        sort_order: Number(form.sort_order) || 0,
      })
      toast.success(editing ? 'Kategori diperbarui' : 'Kategori dibuat')
      setModalOpen(false)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const map = {}
        Object.entries(apiErrors).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v[0] : v))
        setErrors(map)
      } else {
        toast.error(err.response?.data?.message || extractErrorMessage(err))
      }
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return
    try {
      await del.mutateAsync(c.id)
      toast.success('Kategori dihapus')
    } catch (err) {
      toast.error(err.response?.data?.message || extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Kategori</h2>
          <p className="text-sm text-ink-muted mt-1">Struktur kategori produk (max 2 level).</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={() => openCreate()}>Tambah Kategori</Button>
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : tree.length === 0 ? (
          <div className="p-10"><EmptyState icon={<FolderTree size={40} strokeWidth={1.2} />} title="Belum ada kategori" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {tree.map((cat) => (
              <CategoryNode key={cat.id} node={cat} onEdit={openEdit} onDelete={handleDelete} onAddChild={openCreate} />
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} loading={save.isPending}>Simpan</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </div>
          <Input label="Slug (opsional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="dibuat otomatis" error={errors.slug} />
          <Input label="Urutan" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} error={errors.sort_order} />
          <div className="sm:col-span-2">
            <Select label="Parent (opsional)" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} error={errors.parent_id}>
              <option value="">— Tidak ada (root) —</option>
              {flat.filter((c) => c.id !== editing).map((c) => (
                <option key={c.id} value={c.id}>{'— '.repeat(c.depth)}{c.name}</option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function CategoryNode({ node, onEdit, onDelete, onAddChild, depth = 0 }) {
  return (
    <>
      <li className="px-5 py-3 flex items-center gap-3 hover:bg-paper-soft">
        <div style={{ paddingLeft: `${depth * 24}px` }} className="flex items-center gap-2 flex-1 min-w-0">
          {depth > 0 && <ChevronRight size={14} className="text-ink-faint shrink-0" />}
          <p className="text-sm text-ink font-medium">{node.name}</p>
          <span className="text-2xs text-ink-muted tabular-nums">/{node.slug}</span>
          <span className="text-2xs text-ink-muted">· {node.products_count} produk</span>
        </div>
        <div className="flex items-center gap-1">
          {depth === 0 && (
            <button onClick={() => onAddChild(node.id)} className="text-2xs text-ink-muted hover:text-ink px-2 py-1 hover:bg-paper-warm rounded inline-flex items-center gap-1">
              <Plus size={12} /> sub
            </button>
          )}
          <button onClick={() => onEdit(node)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-warm rounded">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(node)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded">
            <Trash2 size={14} />
          </button>
        </div>
      </li>
      {node.children?.map((child) => (
        <CategoryNode key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} depth={depth + 1} />
      ))}
    </>
  )
}

function buildTree(items) {
  const map = new Map(items.map((i) => [i.id, { ...i, children: [] }]))
  const roots = []
  for (const item of map.values()) {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(item)
    } else {
      roots.push(item)
    }
  }
  return roots
}

function flatten(tree, depth = 0) {
  const result = []
  for (const node of tree) {
    result.push({ id: node.id, name: node.name, depth })
    if (node.children?.length) result.push(...flatten(node.children, depth + 1))
  }
  return result
}
