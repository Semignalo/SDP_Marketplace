import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headset } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { SkeletonProductCard } from '../components/ui'
import { useProducts, useVendors, useCategories } from '../hooks/useProducts'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'

export default function HomePage() {
  const { data: featured, isLoading: loadingFeatured } = useProducts({ per_page: 10, sort: 'newest' })
  const { data: vendors = [], isLoading: loadingVendors } = useVendors()
  const { data: categories = [] } = useCategories()

  return (
    <div className="bg-paper">
      <Hero />

      <BrandStrip vendors={vendors} isLoading={loadingVendors} />

      <CategoryGrid categories={categories} />

      <FeaturedSection products={featured?.data || []} isLoading={loadingFeatured} />

      <ValueStrip />

      <EditorialBlock />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative">
      <div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[640px]">
        <div className="flex items-center bg-paper-soft order-2 lg:order-1">
          <div className="container-page lg:pr-16 py-16 lg:py-24">
            <p className="text-2xs font-bold uppercase tracking-[0.3em] text-ink-muted mb-4">
              Koleksi Pilihan
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
              Brand pilihan,<br />
              <span className="italic font-light">dalam satu tempat.</span>
            </h1>
            <p className="mt-6 text-base text-ink-muted max-w-md leading-relaxed">
              Marketplace multi-brand untuk fashion, beauty, dan kebutuhan harian dari kurator terpercaya.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-ink text-white text-xs font-semibold uppercase tracking-widest hover:bg-ink-soft transition rounded"
              >
                Belanja Sekarang
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center justify-center h-12 px-8 border border-ink text-ink text-xs font-semibold uppercase tracking-widest hover:bg-ink hover:text-white transition rounded"
              >
                Jelajahi Brand
              </Link>
            </div>
          </div>
        </div>

        <div className="relative bg-paper-warm order-1 lg:order-2 min-h-[320px] lg:min-h-0">
          <img
            src={HERO_IMAGE}
            alt="Koleksi pilihan"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

function BrandStrip({ vendors, isLoading }) {
  return (
    <section className="border-y border-line bg-paper">
      <div className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted">
            Brand Pilihan
          </h2>
          <Link to="/vendors" className="text-xs text-ink-muted hover:text-ink underline-offset-4 hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 w-20 shrink-0 rounded-pill bg-paper-warm animate-pulse" />
              ))
            : vendors.map((v) => (
                <Link
                  key={v.id}
                  to={`/vendor/${v.slug}`}
                  className="group shrink-0 flex flex-col items-center gap-2.5 w-24"
                >
                  <div className="h-20 w-20 rounded-pill bg-paper-warm border border-line flex items-center justify-center text-ink-soft text-sm font-semibold uppercase tracking-wider group-hover:border-ink transition">
                    {v.logo ? (
                      <img src={v.logo} alt={v.name} className="h-full w-full object-cover rounded-pill" />
                    ) : (
                      <span>{v.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <p className="text-2xs text-center text-ink-muted line-clamp-1 w-full group-hover:text-ink transition">
                    {v.name}
                  </p>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}

function CategoryGrid({ categories }) {
  if (categories.length === 0) return null
  const items = categories.slice(0, 6)
  return (
    <section className="container-page py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2">
            Kategori
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Belanja per Kategori</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="group relative aspect-square overflow-hidden rounded bg-paper-warm"
          >
            <img
              src={`https://picsum.photos/seed/cat-${cat.slug}/400/400`}
              alt={cat.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-white text-sm font-semibold tracking-wide">{cat.name}</p>
              <p className="text-white/70 text-2xs uppercase tracking-widest mt-0.5">
                {cat.children?.length || 0} subkategori
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FeaturedSection({ products, isLoading }) {
  return (
    <section className="container-page pb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2">
            Baru Datang
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Produk Pilihan</h2>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink hover:gap-3 transition-all"
        >
          Lihat Semua <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonProductCard key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-8 sm:hidden">
        <Link
          to="/products"
          className="block w-full text-center border border-ink text-ink py-3 rounded text-xs font-semibold uppercase tracking-widest hover:bg-ink hover:text-white transition"
        >
          Lihat Semua Produk
        </Link>
      </div>
    </section>
  )
}

function ValueStrip() {
  const items = [
    { icon: <Truck size={22} strokeWidth={1.5} />, title: 'Gratis Ongkir', desc: 'Min. belanja Rp 150.000' },
    { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Produk Original', desc: 'Brand resmi terverifikasi' },
    { icon: <RotateCcw size={22} strokeWidth={1.5} />, title: 'Retur Mudah', desc: 'Garansi 7 hari' },
    { icon: <Headset size={22} strokeWidth={1.5} />, title: 'Respon Cepat', desc: 'CS aktif setiap hari' },
  ]
  return (
    <section className="border-y border-line bg-paper-soft">
      <div className="container-page py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <span className="text-ink shrink-0">{it.icon}</span>
            <div>
              <p className="text-sm font-semibold text-ink">{it.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EditorialBlock() {
  return (
    <section className="container-page py-20">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
            alt="Editorial"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="lg:pl-8">
          <p className="text-2xs font-bold uppercase tracking-[0.3em] text-ink-muted mb-4">Editorial</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
            Kurasi brand <br />terbaik di Indonesia.
          </h2>
          <p className="text-base text-ink-muted leading-relaxed max-w-md mb-8">
            Setiap brand di SDP melewati proses kurasi ketat. Kami percaya pada kualitas, cerita di balik produk, dan pengalaman belanja yang jujur.
          </p>
          <Link
            to="/vendors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 hover:gap-3 transition-all"
          >
            Kenali Brand Kami <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
