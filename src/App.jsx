import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar, { MobileMenuDrawer } from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import MobileBottomNav from './components/MobileBottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import { Spinner } from './components/ui'
import { useAuthStore } from './stores/useAuthStore'
import { getToken } from './lib/api'

// Public pages — eagerly load the most-visited ones (Home, Products) untuk hindari extra round-trip
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'

// Lazy-loaded routes
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const EmailVerifiedPage = lazy(() => import('./pages/EmailVerifiedPage'))
const StyleGuidePage = lazy(() => import('./pages/StyleGuidePage'))
const ReferralRedirectPage = lazy(() => import('./pages/ReferralRedirectPage'))
const VendorPage = lazy(() => import('./pages/VendorPage'))
const VendorsPage = lazy(() => import('./pages/VendorsPage'))
const BantuanPage = lazy(() => import('./pages/BantuanPage'))
const KontakPage = lazy(() => import('./pages/KontakPage'))
const KebijakanPage = lazy(() => import('./pages/KebijakanPage'))
const SyaratPage = lazy(() => import('./pages/SyaratPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const AccountLayout = lazy(() => import('./layouts/AccountLayout'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'))
const AddressPage = lazy(() => import('./pages/account/AddressPage'))
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'))
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage'))
const InvoicePage = lazy(() => import('./pages/account/InvoicePage'))
const ResellerDashboardPage = lazy(() => import('./pages/account/ResellerDashboardPage'))

const VendorLayout = lazy(() => import('./layouts/VendorLayout'))
const VendorDashboardPage = lazy(() => import('./pages/vendor/VendorDashboardPage'))
const VendorProductsPage = lazy(() => import('./pages/vendor/VendorProductsPage'))
const VendorOrdersPage = lazy(() => import('./pages/vendor/VendorOrdersPage'))
const VendorOrderDetailPage = lazy(() => import('./pages/vendor/VendorOrderDetailPage'))
const VendorProfilePage = lazy(() => import('./pages/vendor/VendorProfilePage'))

const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminVendorsPage = lazy(() => import('./pages/admin/AdminVendorsPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'))
const AdminCommissionsPage = lazy(() => import('./pages/admin/AdminCommissionsPage'))
const AdminWithdrawalsPage = lazy(() => import('./pages/admin/AdminWithdrawalsPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const setReady = useAuthStore((s) => s.setReady)

  useEffect(() => {
    if (getToken()) {
      fetchMe()
    } else {
      setReady(true)
    }
  }, [fetchMe, setReady])

  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone pages — tanpa Navbar/Footer */}
        <Route
          path="/akun/pesanan/:orderNumber/invoice"
          element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <InvoicePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* Semua halaman lain pakai AppShell */}
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}

function AppShell() {

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content" className="flex-1 pb-14 lg:pb-0">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/vendor/:slug" element={<VendorPage />} />
              <Route path="/keranjang" element={<CartPage />} />
              <Route
                path="/checkout"
                element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
              />
              <Route
                path="/order/sukses/:orderNumber"
                element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/email-verified" element={<EmailVerifiedPage />} />
              {import.meta.env.DEV && <Route path="/style-guide" element={<StyleGuidePage />} />}
              <Route path="/r/:code" element={<ReferralRedirectPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/bantuan" element={<BantuanPage />} />
              <Route path="/kontak" element={<KontakPage />} />
              <Route path="/kebijakan" element={<KebijakanPage />} />
              <Route path="/syarat" element={<SyaratPage />} />

              <Route
                path="/akun"
                element={
                  <ProtectedRoute>
                    <AccountLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/akun/profil" replace />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="alamat" element={<AddressPage />} />
                <Route path="pesanan" element={<OrdersPage />} />
                <Route path="pesanan/:orderNumber" element={<OrderDetailPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="komisi" element={<ResellerDashboardPage />} />
              </Route>

              <Route
                path="/vendor"
                element={
                  <ProtectedRoute roles={['vendor_admin']}>
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<VendorDashboardPage />} />
                <Route path="produk" element={<VendorProductsPage />} />
                <Route path="pesanan" element={<VendorOrdersPage />} />
                <Route path="pesanan/:orderNumber" element={<VendorOrderDetailPage />} />
                <Route path="profil" element={<VendorProfilePage />} />
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="vendors" element={<AdminVendorsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="pesanan/:orderNumber" element={<AdminOrderDetailPage />} />
                <Route path="commissions" element={<AdminCommissionsPage />} />
                <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />

      <MobileMenuDrawer />
      <CartDrawer />
      <MobileBottomNav />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Memuat halaman">
      <Spinner size={24} />
    </div>
  )
}
