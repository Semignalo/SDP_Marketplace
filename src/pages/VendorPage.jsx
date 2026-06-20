import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useVendor } from '../hooks/useProducts'
import { Skeleton, EmptyState, Pagination } from '../components/ui'
import ProductCard from '../components/ProductCard'

export default function VendorPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useVendor(slug)

  const vendor   = data?.data
  const products = data?.products

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded" />)}
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20">
        <EmptyState icon={<Store size={40} strokeWidth={1.2} />} title="Toko tidak ditemukan" />
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header toko */}
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 rounded-full bg-paper-warm border border-line overflow-hidden shrink-0 flex items-center justify-center">
          {vendor.logo
            ? <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
            : <Store size={28} className="text-ink-faint" strokeWidth={1.2} />
          }
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">{vendor.name}</h1>
          {vendor.description && (
            <p className="text-sm text-ink-muted mt-1 max-w-xl">{vendor.description}</p>
          )}
          <p className="text-2xs text-ink-muted mt-2 uppercase tracking-widest">
            {vendor.products_count} produk aktif
          </p>
        </div>
      </div>

      {/* Grid produk */}
      {products?.data?.length === 0 ? (
        <EmptyState icon={<Store size={40} strokeWidth={1.2} />} title="Belum ada produk" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {products?.data?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {products?.meta?.last_page > 1 && (
            <Pagination
              currentPage={products.meta.current_page}
              totalPages={products.meta.last_page}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
