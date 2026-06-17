import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { User, MapPin, Package, Heart, Wallet, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { cn } from '../lib/utils'

export default function AccountLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const items = [
    { to: '/akun/profil', icon: <User size={16} />, label: 'Profile' },
    { to: '/akun/alamat', icon: <MapPin size={16} />, label: 'Addresses' },
    { to: '/akun/pesanan', icon: <Package size={16} />, label: 'Orders' },
    { to: '/akun/wishlist', icon: <Heart size={16} />, label: 'Wishlist' },
    // Komisi tab shows for every authenticated user (tier loyalty refactor)
    ...(user ? [{ to: '/akun/komisi', icon: <Wallet size={16} />, label: 'Commissions' }] : []),
  ]

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8 pb-6 border-b border-line">
        <p className="eyebrow mb-2">Account</p>
        <h1 className="text-3xl font-bold tracking-tight">Hi, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-ink-muted mt-1">{user?.email}</p>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <aside>
          <nav className="space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition',
                    isActive
                      ? 'bg-ink text-white font-medium'
                      : 'text-ink-soft hover:bg-paper-warm',
                  )
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-ink-soft hover:bg-paper-warm transition mt-4 pt-4 border-t border-line"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Sign out</span>
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
