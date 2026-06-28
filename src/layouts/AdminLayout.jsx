import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Store, FolderTree, Package, ShoppingCart, Wallet, ArrowDownToLine, Settings as SettingsIcon, LogOut, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { useAdminPendingOrdersCount } from '../hooks/useAdmin'
import { cn } from '../lib/utils'

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { data: pendingOrders } = useAdminPendingOrdersCount()
  const pendingCount = pendingOrders?.count || 0

  const items = [
    { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: <Users size={16} />, label: 'Users' },
    { to: '/admin/vendors', icon: <Store size={16} />, label: 'Vendors' },
    { to: '/admin/categories', icon: <FolderTree size={16} />, label: 'Categories' },
    { to: '/admin/products', icon: <Package size={16} />, label: 'Products' },
    { to: '/admin/orders', icon: <ShoppingCart size={16} />, label: 'Orders', badge: pendingCount },
    { to: '/admin/commissions', icon: <Wallet size={16} />, label: 'Commissions' },
    { to: '/admin/withdrawals', icon: <ArrowDownToLine size={16} />, label: 'Withdrawals' },
    { to: '/admin/settings', icon: <SettingsIcon size={16} />, label: 'Settings' },
  ]

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper-soft">
      <div className="container-page py-8 lg:py-10">
        <header className="mb-8 pb-6 border-b border-line flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xs font-bold uppercase tracking-eyebrow text-ink-muted mb-2">Admin Panel</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-ink-muted mt-1">{user?.email}</p>
          </div>
          <Link to="/" target="_blank" className="text-xs inline-flex items-center gap-1.5 text-ink-muted hover:text-ink">
            View public site <ExternalLink size={12} />
          </Link>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          <aside>
            <nav className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition',
                      isActive ? 'bg-ink text-white font-medium' : 'text-ink-soft hover:bg-paper',
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {!!item.badge && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-state-danger text-white text-[10px] font-bold leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-ink-soft hover:bg-paper transition mt-4 pt-4 border-t border-line"
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
    </div>
  )
}
