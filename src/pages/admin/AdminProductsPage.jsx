import { useMemo, useState } from 'react'
import { Search, Trash2, Package, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAdminProducts, useUpdateAdminProductStatus, useDeleteAdminProduct, useAdminVendors } from '../../hooks/useAdmin'
import { Input, Select, Badge, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, cn } from '../../lib/utils'

const STATUS_BADGE = {
  active: { label: 'Aktif', variant: 'success' },
  draft: { label: 'Draft', variant: 'warning' },
  archived: { label: 'Arsip', variant: 'neutral' },
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    page,
    ...(search && { search }),
    ...(status && { status }),
    ...(vendorId && { vendor_id: vendorId }),
  }), [page, search, status, vendorId])

  const { data, isLoading } = useAdminProducts(params)
  const { data: vendors } = useAdminVendors({ per_page: 100 })
  const updateStatus = useUpdateAdminProductStatus()
  const del = useDeleteAdminProduct()

  const handleStatusChange = async (p, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id: p.id, status: newStatus })
      toast.success(`Status diubah ke ${newStatus}`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async (p) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    try {
      await del.mutateAsync(p.id)
      toast.success('Produk dihapus')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Produk (Cross-Vendor)</h2>
        <p className="text-sm text-ink-muted mt-1">Lihat semua produk dari semua vendor.</p>
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
        <div className="hidden md:grid grid-cols-[50px_1.8fr_1fr_100px_80px_140px_80px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
          <span></span>
          <span>Produk</span>
          <span>Vendor</span>
          <span className="text-right">Harga</span>
          <span className="text-right">Stok</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
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
                <li key={p.id} className="p-4 md:px-5 md:grid md:grid-cols-[50px_1.8fr_1fr_100px_80px_140px_80px] md:gap-4 md:items-center">
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
                    <button onClick={() => handleDelete(p)} className="h-8 w-8 inline-flex items-center justify-center text-ink-muted hover:text-state-danger hover:bg-paper-warm rounded">
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
    </div>
  )
}
