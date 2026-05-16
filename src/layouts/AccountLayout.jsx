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
    { to: '/akun/profil', icon: <User size={16} />, label: 'Profil' },
    { to: '/akun/alamat', icon: <MapPin size={16} />, label: 'Alamat' },
    { to: '/akun/pesanan', icon: <Package size={16} />, label: 'Pesanan' },
    { to: '/akun/wishlist', icon: <Heart size={16} />, label: 'Wishlist' },
    // Menu Komisi tampil untuk semua user authenticated (tier loyalty refactor)
    ...(user ? [{ to: '/akun/komisi', icon: <Wallet size={16} />, label: 'Komisi' }] : []),
  ]

  const handleLogout = async () => {
    await logout()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8 pb-6 border-b border-line">
        <p className="text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-2">Akun</p>
        <h1 className="text-3xl font-bold tracking-tight">Halo, {user?.name?.split(' ')[0]}</h1>
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
              <span>Keluar</span>
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
