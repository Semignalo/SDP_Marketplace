import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, NavLink } from 'react-router-dom'
import { Search, Menu, X, User, ShoppingBag, Heart, LayoutDashboard } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useCategories, usePublicSettings } from '../hooks/useProducts'
import { cn } from '../lib/utils'
import { Input, CartBadge } from './ui'

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      const goingDown = y > lastY.current
      setHidden(goingDown && y > 96)
      lastY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return hidden
}

export default function Navbar() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const openCart = useUIStore((s) => s.openCart)
  const openMobileMenu = useUIStore((s) => s.openMobileMenu)
  const cartCount = useCartStore((s) => s.count())
  const user = useAuthStore((s) => s.user)
  const { data: settings } = usePublicSettings()
  const { data: categories = [] } = useCategories()
  const hidden = useHideOnScroll()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-paper border-b border-line transition-transform duration-300',
        hidden ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <AnnounceBar settings={settings} />

      <div className="container-page flex items-center gap-6 h-16">
        <button
          type="button"
          onClick={openMobileMenu}
          className="lg:hidden text-ink"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="text-xl font-bold tracking-logo text-ink shrink-0">
          SDP
        </Link>

        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or brands..."
            leadingIcon={<Search size={16} />}
            className="h-10 bg-paper-soft"
          />
        </form>

        <nav className="hidden lg:flex items-center gap-1 ml-auto">
          <Link to="/wishlist" className="h-10 w-10 rounded inline-flex items-center justify-center text-ink hover:bg-paper-warm transition" aria-label="Wishlist">
            <Heart size={20} strokeWidth={1.6} />
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative h-10 w-10 rounded inline-flex items-center justify-center text-ink hover:bg-paper-warm transition"
            aria-label="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.6} />
            <CartBadge count={cartCount} className="absolute top-1 right-1" />
          </button>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="h-10 px-3 rounded inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-paper-warm transition"
            >
              <LayoutDashboard size={15} strokeWidth={1.6} />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          )}
          {user?.role === 'vendor_admin' && (
            <Link
              to="/vendor"
              className="h-10 px-3 rounded inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-paper-warm transition"
            >
              <LayoutDashboard size={15} strokeWidth={1.6} />
              <span className="hidden xl:inline">Vendor Panel</span>
            </Link>
          )}
          {user ? (
            <Link
              to="/akun"
              className="h-10 px-3 rounded inline-flex items-center gap-2 text-sm text-ink hover:bg-paper-warm transition"
            >
              <User size={18} strokeWidth={1.6} />
              <span className="hidden xl:inline max-w-[100px] truncate">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="h-10 px-4 rounded inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-paper-warm transition"
            >
              <User size={16} strokeWidth={1.6} />
              Sign in
            </Link>
          )}
        </nav>

        <div className="flex lg:hidden items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={openCart}
            className="relative h-10 w-10 rounded inline-flex items-center justify-center text-ink"
            aria-label="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.6} />
            <CartBadge count={cartCount} className="absolute top-1 right-1" />
          </button>
        </div>
      </div>

      <CategoryStrip categories={categories} />
    </header>
  )
}

const ANNOUNCE_DISMISS_KEY = 'sdp-announce-dismissed'

function AnnounceBar({ settings }) {
  const items = [settings?.announce_bar_1, settings?.announce_bar_2].filter(Boolean)
  const signature = items.join('|')
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !signature) return
    setDismissed(localStorage.getItem(ANNOUNCE_DISMISS_KEY) === signature)
  }, [signature])

  if (items.length === 0 || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCE_DISMISS_KEY, signature)
    setDismissed(true)
  }

  return (
    <div className="bg-ink text-white relative">
      <div className="container-page py-2 flex items-center justify-center gap-8 text-2xs tracking-widest uppercase overflow-hidden pr-8">
        {items.map((text, i) => (
          <span key={i} className={cn('whitespace-nowrap', i > 0 && 'hidden md:inline')}>
            {text}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center text-white/60 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function CategoryStrip({ categories }) {
  if (!categories || categories.length === 0) return null
  return (
    <div className="hidden lg:block border-t border-line">
      <div className="container-page">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {categories.slice(0, 8).map((cat) => (
            <NavLink
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className={({ isActive }) =>
                cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-muted hover:text-ink border-b-2 border-transparent hover:border-ink transition whitespace-nowrap',
                  isActive && 'text-ink border-ink',
                )
              }
            >
              {cat.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export function MobileMenuDrawer() {
  const open = useUIStore((s) => s.mobileMenuOpen)
  const close = useUIStore((s) => s.closeMobileMenu)
  const { data: categories = [] } = useCategories()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const submitSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
      close()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-paper lg:hidden flex flex-col">
      <div className="flex items-center justify-between px-5 h-16 border-b border-line">
        <span className="text-xl font-bold tracking-logo text-ink">SDP</span>
        <button onClick={close} className="text-ink p-2" aria-label="Close">
          <X size={22} />
        </button>
      </div>
      <div className="px-5 py-4 border-b border-line">
        <form onSubmit={submitSearch}>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            leadingIcon={<Search size={16} />}
            autoFocus
            className="h-11 bg-paper-soft"
          />
        </form>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <Link to="/" onClick={close} className="block px-5 py-3 text-sm font-medium text-ink border-b border-line">
          Home
        </Link>
        <Link to="/products" onClick={close} className="block px-5 py-3 text-sm font-medium text-ink border-b border-line">
          All Products
        </Link>
        <p className="px-5 pt-5 pb-2 text-2xs font-bold uppercase tracking-widest text-ink-muted">Categories</p>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            onClick={close}
            className="block px-5 py-3 text-sm text-ink-soft hover:bg-paper-warm border-b border-line"
          >
            {cat.name}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line px-5 py-4 space-y-2">
        {user?.role === 'admin' && (
          <Link to="/admin" onClick={close} className="block w-full text-center border border-ink py-3 rounded text-sm font-medium text-ink">
            Admin Panel
          </Link>
        )}
        {user?.role === 'vendor_admin' && (
          <Link to="/vendor" onClick={close} className="block w-full text-center border border-ink py-3 rounded text-sm font-medium text-ink">
            Vendor Panel
          </Link>
        )}
        {user ? (
          <Link to="/akun" onClick={close} className="block w-full text-center bg-ink text-white py-3 rounded text-sm font-medium">
            My Account — {user.name}
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" onClick={close} className="flex-1 text-center bg-ink text-white py-3 rounded text-sm font-medium">
              Sign in
            </Link>
            <Link to="/register" onClick={close} className="flex-1 text-center border border-line py-3 rounded text-sm font-medium text-ink">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
