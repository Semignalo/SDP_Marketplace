import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useVendors } from '../hooks/useProducts'
import { Skeleton, EmptyState } from '../components/ui'

export default function VendorsPage() {
  const { data: vendors, isLoading } = useVendors()

  return (
    <div className="container-page py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Semua Brand</h1>
        <p className="mt-1 text-sm text-ink-muted">Temukan brand favoritmu dan jelajahi koleksi mereka.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : !vendors?.length ? (
        <EmptyState icon={<Store size={40} strokeWidth={1.2} />} title="Belum ada brand" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/vendor/${vendor.slug}`}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-line bg-paper hover:border-ink/30 hover:shadow-card transition text-center"
            >
              <div className="h-16 w-16 rounded-full bg-paper-warm border border-line overflow-hidden flex items-center justify-center shrink-0">
                {vendor.logo
                  ? <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                  : <Store size={24} className="text-ink-faint" strokeWidth={1.2} />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:underline leading-tight">{vendor.name}</p>
                <p className="eyebrow mt-0.5">
                  {vendor.products_count ?? 0} produk
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
