import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headset, Star, PackageSearch } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { Badge, SkeletonProductCard, EmptyState } from '../components/ui'
import { useProducts, useVendors } from '../hooks/useProducts'
import { formatRupiah, calcDiscount } from '../lib/utils'

const HERO_IMAGE = 'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_2000/v1782316750/Gemini_Generated_Image_28yiw428yiw428yi_svibwy.png'

export default function HomePage() {
  const { data: featured, isLoading: loadingFeatured } = useProducts({ per_page: 60, sort: 'newest' })
  const { data: vendors = [], isLoading: loadingVendors } = useVendors()

  const products = featured?.data || []
  // In-stock items first — a wall of sold-out placeholders contradicts "curated confidence"
  const picksForYou = [...products].sort((a, b) => (b.in_stock ? 1 : 0) - (a.in_stock ? 1 : 0))
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

      <ThreeCardSection />

      <EditorialBlock />

      <BrandStrip vendors={vendors} isLoading={loadingVendors} />

      <PromoSection products={promoProducts} />

      <FeaturedSection products={picksForYou} isLoading={loadingFeatured} />

      <StyleInTheWildSection />

      <TopRatedSection products={topRated} />
    </div>
  )
}

function Hero({ productCount, vendorCount, avgRating, totalReviews }) {
  return (
    <section className="relative min-h-[560px] lg:min-h-[680px] flex items-end">
      <img
        src={HERO_IMAGE}
        alt="Curated fashion rack"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" />

      <div className="relative container-page pb-16 lg:pb-20">
        <p className="text-2xs font-bold uppercase tracking-eyebrow text-white/70 mb-4">
          Curated Collection
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05] max-w-2xl">
          The brands you want —<br />
          <span className="italic font-light">finally, in one place.</span>
        </h1>
        <p className="mt-6 text-base text-white/80 max-w-md leading-relaxed">
          Fashion, beauty, everyday essentials — curated by people who actually use them.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white text-ink text-xs font-semibold uppercase tracking-widest hover:bg-white/90 transition rounded-pill"
          >
            Shop now
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/vendors"
            className="inline-flex items-center justify-center h-12 px-8 border border-white text-white text-xs font-semibold uppercase tracking-widest hover:bg-white hover:text-ink transition rounded-pill"
          >
            Explore brands
          </Link>
        </div>

        {(vendorCount > 0 || productCount > 0) && (
          <div className="mt-8 flex items-center gap-6 text-xs text-white/70">
            {vendorCount > 0 && (
              <span>
                <strong className="text-white tabular-nums">{vendorCount}+</strong> trusted brands
              </span>
            )}
            {productCount > 0 && (
              <span>
                <strong className="text-white tabular-nums">{productCount}+</strong> products
              </span>
            )}
            {avgRating && (
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="fill-rating text-rating" />
                <strong className="text-white tabular-nums">{avgRating}</strong>
                {totalReviews > 0 && <span>({totalReviews})</span>}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function BrandStrip({ vendors, isLoading }) {
  const isEmpty = !isLoading && vendors.length === 0

  return (
    <section className="border-y border-line bg-paper">
      <div className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold tracking-tight">Featured brands</h2>
          {!isEmpty && (
            <Link to="/vendors" className="text-xs text-ink-muted hover:text-ink underline-offset-4 hover:underline">
              See all
            </Link>
          )}
        </div>
        {isEmpty ? (
          <p className="text-sm text-ink-muted py-4">New brands are joining soon — check back shortly.</p>
        ) : (
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 w-20 shrink-0 rounded-pill bg-paper-warm animate-pulse" />
                ))
              : vendors.map((v) => (
                  <Link
                    key={v.id}
                    to={`/vendor/${v.slug}`}
                    className="group shrink-0 snap-start flex flex-col items-center gap-2.5 w-24"
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
        )}
      </div>
    </section>
  )
}

function FeaturedSection({ products, isLoading }) {
  const visible = products.slice(0, 10)
  const isEmpty = !isLoading && visible.length === 0

  return (
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Picks for you</h2>
        {!isEmpty && (
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink hover:gap-3 transition-all"
          >
            See all <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<PackageSearch size={32} strokeWidth={1.5} />}
          title="New arrivals coming soon"
          description="Vendors are stocking up. Check back shortly for fresh picks."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonProductCard key={i} />)
            : visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {!isEmpty && (
        <div className="mt-8 sm:hidden">
          <Link
            to="/products"
            className="block w-full text-center border border-ink text-ink py-3 rounded text-xs font-semibold uppercase tracking-widest hover:bg-ink hover:text-white transition"
          >
            See all products
          </Link>
        </div>
      )}
    </section>
  )
}

function PromoSection({ products }) {
  if (products.length < 3) return null
  const [big, ...rest] = products
  const small = rest.slice(0, 4)
  const bigDiscount = calcDiscount(big.price, big.compare_at_price)

  return (
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Don't miss out<span className="text-accent">.</span>
        </h2>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink hover:gap-3 transition-all"
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 md:h-[420px]">
          <Link
            to={`/products/${big.slug}`}
            className="group relative col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto overflow-hidden rounded-lg bg-paper-warm"
          >
            <img
              src={big.primary_image || big.images?.[0]?.url}
              alt={big.name}
              loading="lazy"
              decoding="async"
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
                  loading="lazy"
                  decoding="async"
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
    </section>
  )
}

function TopRatedSection({ products }) {
  if (products.length < 3) return null
  return (
    <section className="section-md container-page">
      <div className="flex items-center gap-2.5 mb-8">
        <Star size={20} className="fill-rating text-rating" />
        <h2 className="text-2xl font-bold tracking-tight">Best rated</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-5 px-5 md:mx-0 md:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-44 sm:w-52 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

function ThreeCardSection() {
  const cards = [
    {
      title: 'Dressed for the moment.',
      subtitle: 'From everyday basics to statement pieces.',
      cta: 'Shop new arrivals',
      to: '/products?sort=newest',
      image: 'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_700/v1779024419/sdp/products/ttr7qvxu0lai7avtkt6a.webp',
    },
    {
      title: 'Skin first, makeup second.',
      subtitle: 'Beauty essentials that actually work.',
      cta: 'Shop beauty',
      to: '/products',
      image: 'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_700/v1782317607/after_edit_2_zdq7qt.png',
    },
    {
      title: 'Treat yourself, responsibly.',
      subtitle: 'Great finds under Rp 200K.',
      cta: 'Shop under 200K',
      to: '/products?max_price=200000',
      image: 'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_700/v1782317659/cstar_yeay_sbko6b.png',
    },
  ]

  return (
    <section className="section-md container-page">
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg"
          >
            <img
              src={card.image}
              alt={card.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 p-6">
              <h3 className="text-white text-xl font-bold tracking-tight leading-snug">{card.title}</h3>
              <p className="mt-1.5 text-white/85 text-sm">{card.subtitle}</p>
              <span className="mt-4 inline-flex items-center h-10 px-5 bg-white text-ink text-2xs font-semibold uppercase tracking-widest rounded-pill">
                {card.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function StyleInTheWildSection() {
  const photos = [
    'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_500/v1782317995/IMG_1922_guvsqn.jpg',
    'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_500/v1782317920/Gemini_Generated_Image_4abje44abje44abj_ccqiwb.png',
    'https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_500/v1782318051/ce_mishel_dk_j053v5.png',
  ]

  return (
    <section className="section-md container-page">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Style, your way.</h2>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink hover:gap-3 transition-all"
        >
          See more <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {photos.map((src) => (
          <div key={src} className="aspect-[4/5] overflow-hidden rounded-lg">
            <img src={src} alt="Lifestyle styling inspiration" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
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
        <div className="aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-lg">
          <img
            src="https://res.cloudinary.com/ddfantaoj/image/upload/f_auto,q_auto:best,w_1200/v1782317775/tumbnail_isuroi.png"
            alt="Curated editorial"
            loading="lazy"
            decoding="async"
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
