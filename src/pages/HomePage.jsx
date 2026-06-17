import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headset, Search, Star } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { Badge, Input, SkeletonProductCard, StarRating } from '../components/ui'
import { useProducts, useVendors, useCategories } from '../hooks/useProducts'
import { formatRupiah, calcDiscount } from '../lib/utils'
import { getCategoryImage } from '../lib/categoryImages'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'

export default function HomePage() {
  const { data: featured, isLoading: loadingFeatured } = useProducts({ per_page: 60, sort: 'newest' })
  const { data: vendors = [], isLoading: loadingVendors } = useVendors()
  const { data: categories = [] } = useCategories()

  const products = featured?.data || []
  const promoProducts = products.filter(
    (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price),
  )
  const ratedProducts = products.filter((p) => p.rating_avg)
  const topRated = [...ratedProducts].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 5)
  const totalReviews = products.reduce((sum, p) => sum + (p.reviews_count || 0), 0)
  const avgRating = ratedProducts.length
    ? (ratedProducts.reduce((sum, p) => sum + p.rating_avg, 0) / ratedProducts.length).toFixed(1)
    : null

  return (
    <div className="bg-paper">
      <Hero
        productCount={featured?.meta?.total}
        vendorCount={vendors.length}
        avgRating={avgRating}
        totalReviews={totalReviews}
      />

      <ValueStrip />

      <BrandStrip vendors={vendors} isLoading={loadingVendors} />

      <CategoryGrid categories={categories} />

      <PromoSection products={promoProducts} />

      <FeaturedSection products={products} isLoading={loadingFeatured} />

      <TopRatedSection products={topRated} />

      <EditorialBlock />
    </div>
  )
}

function Hero({ productCount, vendorCount, avgRating, totalReviews }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <section className="relative">
      <div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[640px]">
        <div className="flex items-center bg-paper-soft order-2 lg:order-1">
          <div className="container-page lg:pr-16 py-16 lg:py-24">
            <p className="eyebrow mb-4">Curated Collection</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
              The brands you want —<br />
              <span className="italic font-light">finally, in one place.</span>
            </h1>
            <p className="mt-6 text-base text-ink-muted max-w-md leading-relaxed">
              Fashion, beauty, everyday essentials — curated by people who actually use them.
            </p>

            <form onSubmit={handleSearch} className="mt-8 max-w-md">
              <div className="relative">
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands, categories..."
                  leadingIcon={<Search size={16} />}
                  className="h-12 pr-24 shadow-card border-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-9 px-4 bg-ink text-white text-2xs font-semibold uppercase tracking-widest rounded hover:bg-ink-soft transition"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-ink text-white text-xs font-semibold uppercase tracking-widest hover:bg-ink-soft transition rounded shadow-card hover:shadow-hover"
              >
                Shop now
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center justify-center h-12 px-8 border border-ink text-ink text-xs font-semibold uppercase tracking-widest hover:bg-ink hover:text-white transition rounded"
              >
                Explore brands
              </Link>
            </div>

            {(vendorCount > 0 || productCount > 0) && (
              <div className="mt-8 flex items-center gap-6 text-xs text-ink-muted">
                {vendorCount > 0 && (
                  <span>
                    <strong className="text-ink tabular-nums">{vendorCount}+</strong> trusted brands
                  </span>
                )}
                {productCount > 0 && (
                  <span>
                    <strong className="text-ink tabular-nums">{productCount}+</strong> products
                  </span>
                )}
                {avgRating && <StarRating value={avgRating} count={totalReviews} size="md" />}
              </div>
            )}
          </div>
        </div>

        <div className="relative bg-paper-warm order-1 lg:order-2 min-h-[320px] lg:min-h-0">
          <img
            src={HERO_IMAGE}
            alt="Curated fashion rack"
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
          <h2 className="eyebrow">Featured Brands</h2>
          <Link to="/vendors" className="text-xs text-ink-muted hover:text-ink underline-offset-4 hover:underline">
            See all
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
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Categories</p>
          <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="group relative aspect-square overflow-hidden rounded-lg bg-paper-warm shadow-card hover:shadow-hover transition-shadow"
          >
            <img
              src={getCategoryImage(cat)}
              alt={cat.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-white text-sm font-semibold tracking-wide">{cat.name}</p>
              <p className="text-white/70 text-2xs uppercase tracking-widest mt-0.5">
                {cat.children?.length || 0} subcategories
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FeaturedSection({ products, isLoading }) {
  const visible = products.slice(0, 10)

  return (
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">New In</p>
          <h2 className="text-2xl font-bold tracking-tight">Picks for you</h2>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink hover:gap-3 transition-all"
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonProductCard key={i} />)
          : visible.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-8 sm:hidden">
        <Link
          to="/products"
          className="block w-full text-center border border-ink text-ink py-3 rounded text-xs font-semibold uppercase tracking-widest hover:bg-ink hover:text-white transition"
        >
          See all products
        </Link>
      </div>
    </section>
  )
}

function PromoSection({ products }) {
  if (products.length < 3) return null
  const [big, ...rest] = products
  const small = rest.slice(0, 4)
  const bigDiscount = calcDiscount(big.price, big.compare_at_price)

  return (
    <section className="bg-accent-soft border-y border-accent/20">
      <div className="container-page section-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 md:h-[420px]">
          <Link
            to={`/products/${big.slug}`}
            className="group relative col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto overflow-hidden rounded-lg bg-paper-warm"
          >
            <img
              src={big.primary_image || big.images?.[0]?.url}
              alt={big.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <div className="absolute top-3 left-3">
              <Badge variant="accent">-{bigDiscount}%</Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <p className="text-white text-2xs uppercase tracking-widest opacity-80 mb-1">{big.vendor?.name}</p>
              <h3 className="text-white text-base md:text-lg font-semibold leading-snug mb-1.5 line-clamp-2">
                {big.name}
              </h3>
              <p className="text-white font-bold tabular-nums">{formatRupiah(big.price)}</p>
            </div>
          </Link>

          {small.map((p) => {
            const pct = calcDiscount(p.price, p.compare_at_price)
            return (
              <Link
                key={p.id}
                to={`/products/${p.slug}`}
                className="group relative col-span-1 aspect-square md:aspect-auto overflow-hidden rounded-lg bg-paper-warm"
              >
                <img
                  src={p.primary_image || p.images?.[0]?.url}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
                <div className="absolute top-2 left-2">
                  <Badge variant="accent" size="sm">-{pct}%</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="text-white text-xs font-semibold leading-snug line-clamp-1">{p.name}</p>
                  <p className="text-white text-xs font-bold tabular-nums">{formatRupiah(p.price)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TopRatedSection({ products }) {
  if (products.length < 3) return null
  return (
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <Star size={20} className="fill-rating text-rating" />
          <div>
            <p className="eyebrow mb-1">Customer Favorites</p>
            <h2 className="text-2xl font-bold tracking-tight">Best rated</h2>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

function ValueStrip() {
  const items = [
    { icon: <Truck size={22} strokeWidth={1.5} />, title: 'Free shipping', desc: 'On orders over Rp 150,000' },
    { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Verified brands', desc: 'No knockoffs, ever' },
    { icon: <RotateCcw size={22} strokeWidth={1.5} />, title: 'Easy returns', desc: '7-day window' },
    { icon: <Headset size={22} strokeWidth={1.5} />, title: 'We’re all ears', desc: 'Support, every day' },
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
    <section className="section-lg container-page">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-lg shadow-card">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
            alt="Curated editorial"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="lg:pl-8">
          <p className="eyebrow mb-4">Editorial</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
            The best brands —<br /><span className="italic font-light">handpicked, not just listed.</span>
          </h2>
          <p className="text-base text-ink-muted leading-relaxed max-w-md mb-8">
            Every brand on SDP earns its spot. We care about quality, the story behind it, and a shopping experience that doesn't cut corners.
          </p>
          <Link
            to="/vendors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 hover:gap-3 transition-all"
          >
            Meet our brands <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
