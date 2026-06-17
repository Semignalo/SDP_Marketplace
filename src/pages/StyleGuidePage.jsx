import { useState } from 'react'
import { Heart, Search, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Skeleton,
  SkeletonProductCard,
  Spinner,
  EmptyState,
  PriceLabel,
  Pagination,
  Modal,
  Drawer,
} from '../components/ui'

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
]

const SAMPLE_PRODUCTS = [
  { name: 'Linen Blouse Crinkle', vendor: 'Lumière Studio', price: 245000, oldPrice: 320000, photo: SAMPLE_PHOTOS[0], badge: 'Baru' },
  { name: 'Vitamin C Brightening Serum 30ml', vendor: 'Kanaya Beauty', price: 189000, photo: SAMPLE_PHOTOS[4] },
  { name: 'Oxford Slim Fit Shirt', vendor: 'Aksen Pria', price: 285000, oldPrice: 380000, photo: SAMPLE_PHOTOS[1], badge: 'Sale' },
  { name: 'Canvas Tote Bag Premium', vendor: 'Atelier Goods', price: 175000, photo: SAMPLE_PHOTOS[3] },
  { name: 'Daily Glow Moisturizer SPF 30', vendor: 'Kanaya Beauty', price: 312000, photo: SAMPLE_PHOTOS[5] },
]

export default function StyleGuidePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(3)

  return (
    <div className="container-page py-10 space-y-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2">Design System</p>
        <h1 className="text-3xl font-bold text-ink">SDP Style Guide</h1>
        <p className="text-sm text-ink-muted mt-2 max-w-xl">
          Monochrome premium minimalis. Typography Inter, radius max 8px, neutral palette — warna datang dari foto produk & aset brand.
        </p>
      </header>

      <Section title="Warna">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch name="ink" hex="#0a0a0a" />
          <Swatch name="ink-soft" hex="#262626" />
          <Swatch name="ink-muted" hex="#525252" />
          <Swatch name="ink-faint" hex="#a3a3a3" />
          <Swatch name="paper" hex="#ffffff" border />
          <Swatch name="paper-soft" hex="#fafafa" border />
          <Swatch name="paper-warm" hex="#f5f5f5" />
          <Swatch name="line" hex="#e5e5e5" />
          <Swatch name="line-strong" hex="#d4d4d4" />
          <Swatch name="state-success" hex="#15803d" />
          <Swatch name="state-warning" hex="#a16207" />
          <Swatch name="state-danger" hex="#b91c1c" />
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="text-4xl font-bold tracking-tight">Heading XL — 36px</p>
          <p className="text-3xl font-bold tracking-tight">Heading L — 30px</p>
          <p className="text-xl font-semibold">Heading M — 20px</p>
          <p className="text-base">Body — 16px. Quick brown fox jumps over the lazy dog.</p>
          <p className="text-sm text-ink-soft">Body small — 14px soft.</p>
          <p className="text-xs text-ink-muted uppercase tracking-[0.25em]">CAPTION — 12px wide tracking</p>
        </div>
      </Section>

      <Section title="Product Card">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {SAMPLE_PRODUCTS.map((p, i) => (
            <ProductCardDemo key={i} {...p} />
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="accent">Accent (CTA beli)</Button>
            <Button variant="link">Link style</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button variant="outline" size="icon" leadingIcon={<Heart size={16} />}>{''}</Button>
            <Button loading>Loading…</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button leadingIcon={<ShoppingBag size={16} />}>Tambah ke Keranjang</Button>
            <Button variant="outline" trailingIcon={<ArrowRight size={16} />}>Lihat Semua</Button>
          </div>
        </div>
      </Section>

      <Section title="Input / Select / Textarea">
        <div className="grid md:grid-cols-2 gap-5 max-w-2xl">
          <Input label="Nama Lengkap" placeholder="Masukkan nama..." />
          <Input label="Email" type="email" placeholder="email@contoh.com" hint="Kami tidak share email kamu." />
          <Input label="Cari produk" leadingIcon={<Search size={16} />} placeholder="Cari sesuatu..." />
          <Input label="Password" type="password" placeholder="••••••••" error="Minimal 8 karakter" />
          <Select
            label="Urutkan"
            options={[
              { value: 'newest', label: 'Terbaru' },
              { value: 'price_asc', label: 'Harga: Rendah → Tinggi' },
              { value: 'price_desc', label: 'Harga: Tinggi → Rendah' },
            ]}
          />
          <div className="md:col-span-2">
            <Textarea label="Catatan untuk Vendor" placeholder="Pesan tambahan..." rows={3} />
          </div>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-3 items-center">
          <Badge>Neutral</Badge>
          <Badge variant="ink">Featured</Badge>
          <Badge variant="light">Baru</Badge>
          <Badge variant="success">Lunas</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">-25%</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Price Label">
        <div className="space-y-3">
          <PriceLabel price={189000} size="lg" />
          <PriceLabel price={245000} oldPrice={320000} />
          <PriceLabel price={89000} oldPrice={120000} size="sm" />
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl">
          <SkeletonProductCard />
          <SkeletonProductCard />
          <SkeletonProductCard />
          <SkeletonProductCard />
        </div>
      </Section>

      <Section title="Spinner">
        <div className="flex items-center gap-6">
          <Spinner size={16} />
          <Spinner size={24} />
          <Spinner size={36} />
        </div>
      </Section>

      <Section title="Empty State">
        <div className="border border-line rounded-lg bg-paper-soft">
          <EmptyState
            icon={<Package size={48} strokeWidth={1.2} />}
            title="Belum ada pesanan"
            description="Setelah kamu checkout, riwayat pesanan akan muncul di sini."
            action={<Button variant="outline">Mulai Belanja</Button>}
          />
        </div>
      </Section>

      <Section title="Pagination">
        <Pagination currentPage={page} lastPage={18} onChange={setPage} />
        <p className="text-xs text-ink-muted text-center mt-3">Halaman saat ini: {page}</p>
      </Section>

      <Section title="Modal & Drawer & Toast">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>Buka Modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>Buka Drawer (Cart)</Button>
          <Button variant="ghost" onClick={() => toast.success('Berhasil ditambahkan ke keranjang')}>Toast Success</Button>
          <Button variant="ghost" onClick={() => toast.error('Stok habis')}>Toast Error</Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Konfirmasi Pesanan"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button onClick={() => { setModalOpen(false); toast.success('Pesanan dibuat') }}>Konfirmasi</Button>
            </div>
          }
        >
          <p className="text-sm text-ink-soft">
            Pesanan akan diproses setelah pembayaran terkonfirmasi. Total yang harus dibayar:
          </p>
          <p className="text-2xl font-bold mt-3 tabular-nums">{formatRupiahSafe(458000)}</p>
        </Modal>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Keranjang (2)">
          <div className="p-5 space-y-4">
            <CartItemDemo name="Vitamin C Brightening Serum" vendor="Kanaya Beauty" price={189000} qty={1} photo={SAMPLE_PHOTOS[4]} />
            <CartItemDemo name="Linen Blouse Crinkle" vendor="Lumière Studio" price={245000} oldPrice={320000} qty={2} photo={SAMPLE_PHOTOS[0]} />
          </div>
        </Drawer>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-4 pb-2 border-b border-line">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Swatch({ name, hex, border = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-12 w-12 rounded ${border ? 'border border-line' : ''}`}
        style={{ background: hex }}
      />
      <div>
        <p className="text-xs font-medium text-ink">{name}</p>
        <p className="text-2xs text-ink-faint tabular-nums">{hex}</p>
      </div>
    </div>
  )
}

function ProductCardDemo({ name, vendor, price, oldPrice, photo, badge }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] bg-paper-warm overflow-hidden rounded mb-3">
        <img
          src={photo}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
        />
        {badge && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={badge === 'Sale' ? 'danger' : 'ink'}>{badge}</Badge>
          </div>
        )}
        <button
          type="button"
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-pill bg-white shadow-card flex items-center justify-center text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition"
          aria-label="Wishlist"
        >
          <Heart size={14} />
        </button>
      </div>
      <p className="text-2xs uppercase tracking-widest text-ink-faint mb-1">{vendor}</p>
      <p className="text-sm text-ink line-clamp-2 mb-1.5 leading-snug">{name}</p>
      <PriceLabel price={price} oldPrice={oldPrice} size="sm" />
    </div>
  )
}

function CartItemDemo({ name, vendor, price, oldPrice, qty, photo }) {
  return (
    <div className="flex gap-3 pb-4 border-b border-line last:border-0">
      <div className="h-20 w-20 bg-paper-warm rounded overflow-hidden flex-shrink-0">
        {photo && <img src={photo} alt={name} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xs uppercase tracking-wider text-ink-faint">{vendor}</p>
        <p className="text-sm text-ink line-clamp-2">{name}</p>
        <div className="mt-1 flex items-center justify-between">
          <PriceLabel price={price} oldPrice={oldPrice} size="sm" />
          <span className="text-xs text-ink-muted">×{qty}</span>
        </div>
      </div>
    </div>
  )
}

function formatRupiahSafe(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}
