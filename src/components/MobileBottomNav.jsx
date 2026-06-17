import { NavLink, useLocation } from 'react-router-dom'
import { Home, Grid3x3, ShoppingBag, User } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { cn } from '../lib/utils'

// Hide pada path yang punya layout sidebar/full-screen sendiri
const HIDDEN_PREFIXES = ['/admin', '/vendor', '/akun', '/checkout', '/login', '/register']

export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const cartCount = useCartStore((s) => s.count())
  const openCart = useUIStore((s) => s.openCart)
  const openMenu = useUIStore((s) => s.openMobileMenu)
  const user = useAuthStore((s) => s.user)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-line"
      aria-label="Main mobile navigation"
    >
      <div className="grid grid-cols-4 h-14">
        <Item to="/" icon={<Home size={18} />} label="Home" exact />
        <button
          type="button"
          onClick={openMenu}
          className="inline-flex flex-col items-center justify-center gap-0.5 text-ink-muted hover:text-ink active:bg-paper-warm"
          aria-label="Open categories"
        >
          <Grid3x3 size={18} />
          <span className="text-2xs">Categories</span>
        </button>
        <button
          type="button"
          onClick={openCart}
          className="relative inline-flex flex-col items-center justify-center gap-0.5 text-ink-muted hover:text-ink active:bg-paper-warm"
          aria-label="Cart"
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 rounded-pill bg-ink text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-2xs">Cart</span>
        </button>
        <Item
          to={user ? '/akun/profil' : '/login'}
          icon={<User size={18} />}
          label="Account"
        />
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

function Item({ to, icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'inline-flex flex-col items-center justify-center gap-0.5 active:bg-paper-warm transition',
          isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
        )
      }
    >
      {icon}
      <span className="text-2xs">{label}</span>
    </NavLink>
  )
}
