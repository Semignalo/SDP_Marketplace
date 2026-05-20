# SDP Marketplace — Roadmap Pengembangan

> Terakhir diperbarui: 19 Mei 2026

---

## Status Keseluruhan

| Phase | Deskripsi | Status | Estimasi |
|---|---|---|---|
| 1 | Backend Foundation | ✅ Selesai | 1-2 hari |
| 2 | Public Browse API | ✅ Selesai | 1 hari |
| 3 | Design System Frontend | ✅ Selesai | 1-2 hari |
| 4 | Frontend Public Pages | ✅ Selesai | 3-4 hari |
| 5 | Auth & User Account | ✅ Selesai | 2 hari |
| 6 | Cart & Checkout | ✅ Selesai | 2-3 hari |
| 7 | Midtrans Snap Integration | ✅ Selesai | 2-3 hari |
| 8 | Reseller Features | ✅ Selesai | 2 hari |
| 9 | Vendor Panel | ✅ Selesai | 3-4 hari |
| 10 | Admin Panel | ✅ Selesai | 4-5 hari |
| 11 | Polish & UX | ✅ Selesai | 2-3 hari |
| 12 | Testing & QA | ✅ Selesai | 2 hari |
| 13 | Deploy ke VPS | 🔲 Belum | 1-2 hari |
| 14 | Tier Loyalty + Role Refactor | ✅ Selesai | 1 hari |
| 15 | UX Polish + Payment + Invoice | ✅ Selesai | 1 hari |
| 16 | Email Verifikasi + Midtrans + Cancel + Withdrawal | ✅ Selesai | 2 hari |

---

## Detail Per Phase

### ✅ Phase 1 — Backend Foundation
**Goal:** Auth jalan, DB terisi data realistis.

- ✅ Relasi Eloquent & `$fillable` di 9 model (User, Vendor, Category, Product, ProductImage, Order, OrderItem, ResellerCommission, Setting)
- ✅ `AuthController` — `register`, `login`, `logout`, `me`
- ✅ `routes/api.php` terdaftar di `bootstrap/app.php`
- ✅ 5 Seeder (Settings, Category, Vendor, User, Product)
- ✅ Sanctum + CORS dikonfigurasi untuk frontend port 5174
- ✅ Smoke test: login admin & vendor, endpoint `/me` jalan

**File yang dibuat/diubah:**
- `sdp-api/app/Models/*.php` — semua 9 model
- `sdp-api/app/Http/Controllers/Api/AuthController.php`
- `sdp-api/app/Http/Requests/Auth/RegisterRequest.php`
- `sdp-api/app/Http/Requests/Auth/LoginRequest.php`
- `sdp-api/app/Http/Resources/UserResource.php`
- `sdp-api/routes/api.php`
- `sdp-api/bootstrap/app.php`
- `sdp-api/config/cors.php`
- `sdp-api/database/seeders/DatabaseSeeder.php`
- `sdp-api/database/seeders/SettingsSeeder.php`
- `sdp-api/database/seeders/CategorySeeder.php`
- `sdp-api/database/seeders/VendorSeeder.php`
- `sdp-api/database/seeders/UserSeeder.php`
- `sdp-api/database/seeders/ProductSeeder.php`

---

### ✅ Phase 2 — Public Browse API
**Goal:** Frontend bisa fetch produk asli dari database.

- ✅ `GET /api/products` — pagination + filter (`category`, `vendor`, `min_price`, `max_price`, `search`, `sort`, `per_page`)
- ✅ `GET /api/products/{slug}` — detail + images + vendor + category + related products
- ✅ `GET /api/categories` — tree hierarkis (parent + children)
- ✅ `GET /api/categories/{slug}` — detail kategori
- ✅ `GET /api/vendors` — list semua vendor aktif + products_count
- ✅ `GET /api/vendors/{slug}` — detail vendor + produk-nya (paginated)
- ✅ `GET /api/settings/public` — site name, tagline, shipping, announce bar, dll
- ✅ API Resource untuk response shape konsisten (ProductResource, CategoryResource, VendorResource, ProductImageResource)
- ✅ `effective_price` di ProductResource — auto-pakai `price_reseller` jika user role=reseller

**File yang dibuat:**
- `sdp-api/app/Http/Resources/ProductResource.php`
- `sdp-api/app/Http/Resources/ProductImageResource.php`
- `sdp-api/app/Http/Resources/CategoryResource.php`
- `sdp-api/app/Http/Resources/VendorResource.php`
- `sdp-api/app/Http/Controllers/Api/ProductController.php`
- `sdp-api/app/Http/Controllers/Api/CategoryController.php`
- `sdp-api/app/Http/Controllers/Api/VendorController.php`
- `sdp-api/app/Http/Controllers/Api/SettingController.php`
- `sdp-api/routes/api.php` (update)

**Sort options:** `newest` (default), `oldest`, `price_asc`, `price_desc`, `name_asc`

**Smoke test verified:**
- ✅ `GET /api/products?per_page=2` → 35 produk, 18 halaman
- ✅ `GET /api/products/{slug}` → produk + 4 related
- ✅ `GET /api/products?search=serum` → 1 hasil match
- ✅ `GET /api/products?category=beauty&sort=price_asc` → urut harga ascending
- ✅ `GET /api/vendors/atelier-goods` → vendor + 7 produknya

---

### ✅ Phase 3 — Design System Frontend
**Goal:** Fondasi UI siap, semua komponen primitive reusable.

- ✅ Install dependencies: `zustand`, `@tanstack/react-query`, `framer-motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`, `@headlessui/react`, `clsx`, `tailwind-merge`
- ✅ Token Tailwind: warna `ink/paper/accent/line/state`, font Inter, radius max 8px, shadow card/hover
- ✅ Font Inter di-preload dari Google Fonts
- ✅ `index.css` — base styles, focus-visible ring, `.container-page` helper, scrollbar-hide
- ✅ Komponen primitive di `src/components/ui/`: Button (6 variant), Input, Textarea, Select, Badge (7 variant), Skeleton, SkeletonProductCard, Spinner, EmptyState, PriceLabel (3 ukuran + diskon auto), Pagination, Modal (Headless UI + Transition), Drawer (3 side: right/left/bottom)
- ✅ `src/lib/utils.js` — `cn`, `formatRupiah`, `formatDate`, `calcDiscount`, `slugify`
- ✅ `src/lib/api.js` — axios instance + Bearer token interceptor + 401 auto redirect + `extractErrorMessage`
- ✅ `src/lib/queryClient.js` — React Query default config
- ✅ `src/stores/` — `useAuthStore` (login/register/logout/me + persist user), `useCartStore` (add/remove/setQty + persist), `useUIStore` (cart/menu/search open state)
- ✅ Providers di `main.jsx` — QueryClientProvider + Sonner Toaster
- ✅ Halaman `/style-guide` — preview semua komponen (warna, typography, button, input, badge, price label, skeleton, spinner, empty state, pagination, modal, drawer, toast)
- ✅ Build production sukses (1793 modules, 353 KB JS / 109 KB gzip)

**File yang dibuat/diubah:**
- `tailwind.config.js`, `index.html`, `src/index.css`
- `src/lib/api.js`, `src/lib/queryClient.js`, `src/lib/utils.js`
- `src/stores/useAuthStore.js`, `useCartStore.js`, `useUIStore.js`
- `src/components/ui/*.jsx` (11 file + `index.js` barrel export)
- `src/pages/StyleGuidePage.jsx`
- `src/main.jsx`, `src/App.jsx`

---

### ✅ Phase 4 — Frontend Public Pages
**Goal:** Customer bisa browse & lihat detail produk dengan tampilan monochrome premium.

- ✅ `src/hooks/useProducts.js` — React Query hooks (useProducts, useProduct, useCategories, useVendors, useVendor, usePublicSettings)
- ✅ Refactor `App.jsx` — global ScrollToTop, integrated MobileMenuDrawer + CartDrawer, fetchMe on mount jika ada token
- ✅ `Navbar` monochrome — sticky, announcement bar atas (dari settings), search desktop, category strip horizontal, cart count badge, mobile hamburger
- ✅ `MobileMenuDrawer` — fullscreen, search + kategori list + login/register CTA
- ✅ `Footer` — dark mode (bg-ink), 4 kolom (Brand+Belanja+Akun+Bantuan), sosmed, dari publicSettings
- ✅ `HomePage` — Hero split (text + image), BrandStrip (vendor circles), CategoryGrid (6 kategori dengan foto Picsum), Featured Products (10 produk dari API), ValueStrip (4 perks), EditorialBlock (story-driven section)
- ✅ `ProductsPage` — filter sidebar (kategori hierarkis) desktop + Drawer mobile, sort dropdown, grid 2/3/4 kolom, pagination, search query dari URL, empty state
- ✅ `ProductDetailPage` — breadcrumb, gallery dengan thumbnail, qty selector, add to cart + buy now, related products, perks
- ✅ `ProductCard` refactor — aspect 3/4, hover scale image, badge diskon/sold out, wishlist icon hover
- ✅ `LoginPage` & `RegisterPage` — pakai design system, integrated dengan useAuthStore, error handling per field
- ✅ `CartDrawer` global — list items, qty adjuster inline, remove item, subtotal, link ke checkout

**File yang dibuat/diubah:**
- `src/hooks/useProducts.js`
- `src/components/Navbar.jsx`, `Footer.jsx`, `ProductCard.jsx`, `CartDrawer.jsx`
- `src/pages/HomePage.jsx`, `ProductsPage.jsx`, `ProductDetailPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`
- `src/App.jsx`

**Belum dikerjakan di Phase 4 (akan menyusul saat dibutuhkan):**
- `VendorPage` (`/vendor/{slug}`)
- `CategoryPage` standalone (sementara pakai `/products?category={slug}`)
- `SearchResultsPage` standalone (sementara pakai `/products?search=`)
- Halaman 404 custom
- `MobileBottomNav` fixed bottom

---

### ✅ Phase 5 — Auth & User Account
**Goal:** Customer punya akun, history, wishlist.

- ✅ `LoginPage` & `RegisterPage` — react-hook-form + zod, error inline per field
- ✅ `ProtectedRoute` — guard halaman `/akun/*`, redirect dengan `?next=` parameter
- ✅ `AccountLayout` — sidebar nav adaptif per role (+ Komisi khusus reseller), logout button
- ✅ `ProfilePage` — edit profil (nama, telepon) + ganti password (section terpisah)
- ✅ `AddressPage` — CRUD alamat dengan Modal, set default address
- ✅ `OrdersPage` — list pesanan dengan filter status pills, pagination
- ✅ `OrderDetailPage` — detail pesanan, alamat, kurir, item, ringkasan total
- ✅ `WishlistPage` — grid produk dari wishlist API, toggle wishlist
- ✅ `WishlistButton` — floating (ProductCard) + inline (ProductDetailPage), auto-redirect login
- ✅ Migration `addresses` + `wishlists` table
- ✅ Backend routes: profile, address CRUD, wishlist toggle, orders, order detail
- ✅ `src/hooks/useAccount.js` — semua query dan mutation akun
- ✅ Build sukses: 1862 modules, 455 KB JS / 140 KB gzip

**File yang dibuat/diubah:**
- `sdp-api/database/migrations/*_create_addresses_table.php`
- `sdp-api/database/migrations/*_create_wishlists_table.php`
- `sdp-api/app/Models/Address.php`, `Wishlist.php`
- `sdp-api/routes/api.php` (tambah 11 route akun)
- `src/components/ProtectedRoute.jsx`
- `src/components/WishlistButton.jsx`
- `src/layouts/AccountLayout.jsx`
- `src/hooks/useAccount.js`
- `src/pages/account/ProfilePage.jsx`, `AddressPage.jsx`, `WishlistPage.jsx`, `OrdersPage.jsx`, `OrderDetailPage.jsx`
- `src/App.jsx` (nested `/akun/*` routes)

---

### ✅ Phase 6 — Cart & Checkout
**Goal:** Customer bisa pesan sebelum payment.

- ✅ `CheckoutController@store` — DB transaction: lock product, validate stock, decrement stock, create order + items, auto-create reseller commission jika `reseller_code` valid
- ✅ Order number generator: `SDP-{YYYYMMDD}-{5char random}` unique check
- ✅ `GET /api/checkout/options` — list 6 kurir hardcoded (JNE REG/YES, J&T, SiCepat, AnterAja, POS) + free shipping threshold
- ✅ Free shipping otomatis jika subtotal >= `shipping_min_free` (150k)
- ✅ Harga reseller otomatis dipakai jika user role=reseller
- ✅ `useCheckout` hook (useCheckoutOptions, useCreateOrder)
- ✅ `CartPage` (`/keranjang`) — table desktop / stacked mobile, qty adjuster, free shipping progress bar
- ✅ `CheckoutPage` (`/checkout`) — multi-step (Alamat → Kurir → Review), Stepper interaktif, inline Modal tambah alamat baru, summary sticky
- ✅ `OrderSuccessPage` (`/order/sukses/{orderNumber}`) — placeholder untuk Phase 7 (Midtrans Snap)
- ✅ Smoke test passed: order created, stock decremented, reseller commission auto-created (rate 10%, status pending)
- ✅ Build sukses: 1866 modules, 476 KB JS / 145 KB gzip

**File yang dibuat/diubah:**
- `sdp-api/app/Http/Controllers/Api/CheckoutController.php`
- `sdp-api/routes/api.php` (+ `/checkout/options`, POST `/orders`)
- `src/hooks/useCheckout.js`
- `src/pages/CartPage.jsx`, `CheckoutPage.jsx`, `OrderSuccessPage.jsx`
- `src/App.jsx` (3 route baru, checkout & success protected)

---

### ✅ Phase 7 — Midtrans Snap Integration
**Goal:** Pembayaran online jalan end-to-end.

- ✅ Install `midtrans/midtrans-php` via composer
- ✅ `config/midtrans.php` + env keys (`MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`)
- ✅ `App\Services\MidtransService`:
  - `isConfigured()` — guard return false jika key kosong
  - `getSnapToken(Order)` — build payload dengan items + shipping line + customer details + gross_amount validation
  - `resolveNotification()` — verify signature otomatis via `Notification` class, map transaction_status → next order status
- ✅ `PaymentController`:
  - `POST /api/orders/{orderNumber}/snap-token` (auth) — return token + client_key + is_production; **return 503 graceful** jika belum configured
  - `POST /api/payments/notification` (public webhook) — verify, update order status, sync commission status (cancelled order → cancelled commission), idempotent
- ✅ Status mapping Midtrans → Order:
  - `capture` + `accept` → `processing` + set `payment_verified_at`
  - `settlement` → `processing` + set `payment_verified_at`
  - `cancel`/`deny`/`expire` → `cancelled` (+ cancel commission)
  - `pending`/`challenge` → stay `pending_payment`
- ✅ Expose `midtrans_client_key` & `midtrans_is_production` di `/api/settings/public` untuk frontend init
- ✅ Frontend `loadSnap({clientKey, isProduction})` di `src/lib/snap.js` — dynamic load Snap.js (sandbox/prod URL otomatis), idempotent
- ✅ `useSnapToken` mutation hook
- ✅ **`OrderSuccessPage` rewrite total**:
  - Tombol "Bayar Sekarang" → fetch token → `snap.pay(token)` dengan callback onSuccess/onPending/onError/onClose
  - **Auto-polling order status setiap 4 detik** selama `pending_payment` → status update otomatis setelah webhook diterima
  - Header & badge dinamis per status (pending/processing/cancelled)
  - Graceful fallback message jika Midtrans belum dikonfigurasi (instruksi setup .env)
- ✅ Smoke test: snap-token tanpa config return 503 dengan pesan jelas, dengan config jalan via dashboard.midtrans.com sandbox

**Catatan untuk go-live:**
1. Daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com), ambil Sandbox Server Key & Client Key
2. Set ke `sdp-api/.env`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
   MIDTRANS_IS_PRODUCTION=false
   ```
3. `php artisan config:clear`
4. Set notification URL di dashboard Midtrans → `https://yourdomain/api/payments/notification`
5. Untuk test local webhook: pakai [ngrok](https://ngrok.com) atau cloudflared tunnel ke port 8001
6. Test VA simulator: [simulator.sandbox.midtrans.com](https://simulator.sandbox.midtrans.com/)

**File yang dibuat:**
- `sdp-api/config/midtrans.php`
- `sdp-api/app/Services/MidtransService.php`
- `sdp-api/app/Http/Controllers/Api/PaymentController.php`
- `sdp-api/routes/api.php` (2 route baru: webhook public + snap-token auth)
- `sdp-api/app/Http/Controllers/Api/SettingController.php` (tambah midtrans keys di publicIndex)
- `src/lib/snap.js`
- `src/hooks/useCheckout.js` (+ `useSnapToken`)
- `src/pages/OrderSuccessPage.jsx` (rewrite)

**TODO menyusul (Phase 11 polish):**
- Email notifikasi via queue (order received, paid, shipped) — perlu setup mailer + queue worker

---

### ✅ Phase 8 — Reseller Features
**Goal:** Reseller dapat referral link, lacak komisi.

- ✅ Backend `ResellerController`: `GET /api/reseller/summary` (total/pending/earned/paid, orders_count, customers_count, reseller_code, rate) + `GET /api/reseller/commissions` (paginated + filter status)
- ✅ Frontend `useReferralStore` (Zustand persist, TTL 30 hari)
- ✅ Route `/r/:code` → `ReferralRedirectPage` simpan ke localStorage + toast, redirect ke `/`
- ✅ `ReferralBadge` strip di bawah Navbar — tampil saat ada kode aktif, ada tombol hapus
- ✅ `CheckoutPage` kirim `reseller_code` ke API + tampilkan badge di summary; clear setelah order sukses
- ✅ `ResellerDashboardPage` (`/akun/komisi`): summary 4 kartu, link referral copy-able, filter status pills, tabel komisi paginated
- ✅ Harga reseller sudah otomatis aktif via `effective_price` di Product Resource (sejak Phase 2)
- ✅ Smoke test: order via reseller code → komisi 32k (10% × 320k) auto-created, summary endpoint return correct totals

**File yang dibuat:**
- `sdp-api/app/Http/Controllers/Api/ResellerController.php`
- `src/stores/useReferralStore.js`
- `src/components/ReferralBadge.jsx`
- `src/hooks/useReseller.js`
- `src/pages/ReferralRedirectPage.jsx`
- `src/pages/account/ResellerDashboardPage.jsx`
- `src/App.jsx` (route + ReferralBadge global), `src/pages/CheckoutPage.jsx` (wire reseller_code)

---

### ✅ Phase 9 — Vendor Panel
**Goal:** Vendor kelola produk sendiri.

- ✅ Middleware `EnsureVendorAdmin` (alias `vendor_admin`) — block non-vendor user
- ✅ `LoginPage` — role-based redirect: vendor_admin → `/vendor`, admin → `/admin`, customer/reseller → `/`
- ✅ `VendorLayout` — sidebar (Dashboard/Produk/Pesanan/Profil), link ke halaman publik produk, logout
- ✅ **Backend 4 controllers + 11 endpoint:**
  - `Vendor\DashboardController`: `/summary`, `/revenue-chart` (30/60/90 hari)
  - `Vendor\ProductController`: index, show, store, update, destroy (CRUD penuh + sync images URL-based)
  - `Vendor\OrderController`: index, show, updateTracking (vendor-scoped, hanya order yang punya item dari vendor)
  - `Vendor\ProfileController`: show, update
- ✅ `useVendor.js` — 10 hooks (summary, chart, products CRUD, orders, tracking update, profile)
- ✅ `VendorDashboardPage` — 4 KPI cards (revenue/orders/products/low stock), bar chart 30 hari SVG inline (monochrome, hover tooltip), top 5 produk
- ✅ `VendorProductsPage` — list dengan search + filter status, Modal CRUD (form lengkap), multi-gambar URL-based (max 8, drag order via index)
- ✅ `VendorOrdersPage` — filter + search, list dengan vendor_subtotal (subtotal item dari vendor saja)
- ✅ `VendorOrderDetailPage` — info customer + alamat, form update no resi, tombol "tandai dikirim" (auto status → shipped)
- ✅ `VendorProfilePage` — edit nama/logo/deskripsi/email/phone, preview logo bulat, info read-only (slug, commission_rate, status)
- ✅ Smoke test: login vendor lumiere-studio → summary return 2 orders, products endpoint return 8 produk vendor
- ✅ Build sukses: 1878 modules, 518 KB JS / 153 KB gzip (warning code split akan di-handle Phase 11)

**Catatan:** Multi-image upload pakai URL paste (bukan file upload), karena setup storage + multipart cukup heavy. File upload akan ditambahkan di Phase 11 polish jika dibutuhkan.

**File yang dibuat:**
- `sdp-api/app/Http/Middleware/EnsureVendorAdmin.php` + alias di `bootstrap/app.php`
- `sdp-api/app/Http/Controllers/Api/Vendor/{Dashboard,Product,Order,Profile}Controller.php`
- `sdp-api/routes/api.php` (vendor route group, 11 endpoint)
- `src/hooks/useVendor.js`
- `src/layouts/VendorLayout.jsx`
- `src/pages/vendor/{VendorDashboard,VendorProducts,VendorOrders,VendorOrderDetail,VendorProfile}Page.jsx`
- `src/pages/LoginPage.jsx` (role-based redirect)
- `src/App.jsx` (nested `/vendor/*` routes, ProtectedRoute roles=['vendor_admin'])

---

### ✅ Phase 10 — Admin Panel
**Goal:** Admin full control atas marketplace.

- ✅ Middleware `EnsureAdmin` (alias `admin`)
- ✅ **Backend: 8 controller + 24 endpoint** di `Api\Admin\`
  - `DashboardController`: `/summary` (revenue, AOV, users, vendors, products counts, top vendor & top produk), `/revenue-chart` (30/60/90 hari)
  - `UserController`: index (filter role + search), update (role/vendor_id/password), destroy
  - `VendorController`: full CRUD + **store auto-create akun vendor_admin terkait**
  - `CategoryController`: full CRUD dengan validasi self-parent & subkategori
  - `ProductController` (cross-vendor): index dengan filter vendor_id, updateStatus, destroy
  - `OrderController`: index, show (lengkap + commission), updateStatus dengan **auto-sync commission status** (completed → earned, cancelled → cancelled)
  - `CommissionController`: index dengan summary, updateStatus, bulkMarkPaid
  - `SettingController`: index (terstruktur per group: Brand/Komisi/Pengiriman/Tampilan/Kontak), bulk update
- ✅ **Frontend: AdminLayout + 9 page**
  - `AdminDashboardPage` — 8 KPI cards (revenue, orders, AOV, pending, users, resellers, vendors, products), bar chart 30 hari (orders+revenue tooltip), 2 list ranking (top vendors & top produk)
  - `AdminUsersPage` — search + filter role, Modal edit (role + vendor_id + password reset)
  - `AdminVendorsPage` — search + filter status, Modal create (lengkap dengan password vendor_admin) + edit
  - `AdminCategoriesPage` — tree display dengan indent, button "+ sub" per parent, Modal CRUD dengan parent select
  - `AdminProductsPage` — cross-vendor, search + filter status + filter vendor, inline status select, delete
  - `AdminOrdersPage` — list dengan customer + reseller code visible
  - `AdminOrderDetailPage` — info lengkap (customer, alamat, kurir, reseller+komisi), update status + admin_notes, item list dengan link ke produk
  - `AdminCommissionsPage` — 4 summary cards, filter status pills, **checkbox multi-select + bulk mark paid**, inline status change
  - `AdminSettingsPage` — auto-grouped form (Brand/Komisi/dll), batch save dengan dirty tracking
- ✅ `useAdmin.js` — 18 hooks (queries + mutations untuk semua resource)
- ✅ Smoke test: admin login → summary return 2 orders + 10 users + 5 vendors + 35 produk + 8 settings keys
- ✅ Build sukses: 1889 modules, 572 KB JS / 162 KB gzip

**Yang di-skip di phase ini** (defer ke polish):
- Invite vendor via email — diganti dengan "admin manual create + auto-buat akun vendor_admin"
- Drag-drop tree editor (`dnd-kit`) — diganti `sort_order` field + parent_id select
- Spatie activity log — tidak diintegrasikan
- Export CSV komisi — tombol belum dibuat
- Code splitting per route — akan di-handle Phase 11

**File yang dibuat:**
- `sdp-api/app/Http/Middleware/EnsureAdmin.php` + alias di `bootstrap/app.php`
- `sdp-api/app/Http/Controllers/Api/Admin/{Dashboard,User,Vendor,Category,Product,Order,Commission,Setting}Controller.php` (8 file)
- `sdp-api/routes/api.php` (admin route group, 24 endpoint)
- `src/hooks/useAdmin.js`
- `src/layouts/AdminLayout.jsx`
- `src/pages/admin/{AdminDashboard,AdminUsers,AdminVendors,AdminCategories,AdminProducts,AdminOrders,AdminOrderDetail,AdminCommissions,AdminSettings}Page.jsx` (9 file)
- `src/App.jsx` (nested `/admin/*` routes, ProtectedRoute roles=['admin'])

---

### ✅ Phase 11 — Polish & UX
**Goal:** Pengalaman user terasa premium dan smooth.

- ✅ **Code splitting per route** dengan `React.lazy` + `Suspense` — semua halaman lazy kecuali Home & Products (eager untuk first-visit)
- ✅ **Vite `manualChunks`** memecah vendor: `vendor-react` (23 KB) / `vendor-data` (92 KB react-query+zustand+axios) / `vendor-ui` (235 KB headlessui+lucide+sonner) — cacheable terpisah
- ✅ **Global `ErrorBoundary`** dengan fallback UI premium (icon + reset button + dev-only stack trace)
- ✅ **`NotFoundPage`** catch-all `*` route dengan branding 404 besar
- ✅ **`MobileBottomNav`** fixed bottom — Home/Kategori/Cart/Akun, hide auto pada admin/vendor/akun/checkout/login pages, cart count badge, safe-area-inset support
- ✅ **AnnouncementBar dismissable** — tombol X kanan, localStorage `sdp-announce-dismissed` per signature (akan tampil lagi kalau text berubah)
- ✅ **Skip-link `.skip-link`** untuk a11y — visible saat keyboard tab
- ✅ `Suspense` fallback per route pakai Spinner sentered
- ✅ Image `loading="lazy"` sudah ada di `ProductCard` sejak Phase 4
- ✅ Focus ring monochrome via `*:focus-visible` di `index.css`
- ✅ Build: **577 KB → split jadi banyak chunk kecil** (initial route home: ~445 KB vendor + ~6 KB Homepage chunk, subsequent navigation = chunk per route 1-12 KB)

**Yang di-skip / dipertimbangkan untuk v2:**
- Lighthouse audit 90+ — perlu dijalankan manual setelah deploy
- Mobile gesture (swipe cart drawer, swipe gallery) — Framer Motion drag, complex, defer
- Email notif via queue (order received/paid/shipped) — perlu Mailtrap setup + queue worker + blade templates
- Image blur placeholder — perlu generate placeholder hash atau pakai library

**File yang dibuat/diubah:**
- `vite.config.js` — `build.rollupOptions.output.manualChunks`
- `src/App.jsx` — rewrite total: React.lazy + Suspense + ErrorBoundary wrapper + skip-link + NotFoundPage catch-all + MobileBottomNav
- `src/components/ErrorBoundary.jsx`
- `src/components/MobileBottomNav.jsx`
- `src/pages/NotFoundPage.jsx`
- `src/components/Navbar.jsx` — AnnounceBar dismissable
- `src/index.css` — skip-link helper class

---

### ✅ Phase 12 — Testing & QA
**Goal:** Semua alur utama terverifikasi sebelum deploy.

- ✅ **PHPUnit Feature Tests: 41 tests, 111 assertions, all pass** (run via `php artisan test`)
  - **`AuthTest`** (7) — register/login/logout/me + email unique validation + auth required
  - **`ProductBrowseTest`** (8) — list/pagination/filter category/filter vendor/search/show by slug/related/inactive hidden
  - **`CheckoutTest`** (10) — create order, stock decrement, free shipping threshold, insufficient stock rejection, invalid courier rejection, reseller commission auto-create, invalid reseller code silently ignored, unauthenticated rejected, reseller price applied
  - **`MidtransWebhookTest`** (8) — settlement→processing, expire→cancelled, pending no-op, 404 unknown order, idempotent (completed tidak revert), commission auto-cancel saat order cancelled, 503 fallback saat tidak configured, snap-token reject non-pending
  - **`AccessControlTest`** (8) — vendor admin scope (only own products & orders), customer blocked from vendor routes, admin blocked from non-admin, admin can update order status, only reseller can access reseller summary
- ✅ Factories: `UserFactory` (+ `admin()`, `reseller()`, `vendorAdmin($id)` states), `VendorFactory`, `CategoryFactory`, `ProductFactory`
- ✅ Test DB: SQLite in-memory (sudah di-config di `phpunit.xml`), bcrypt rounds 4 untuk speed
- ✅ Migration enum fix: `reseller_commissions.status` enum `pending|earned|paid|cancelled` (sebelumnya hanya pending|paid — bug ditemukan via test)
- ✅ **`QA_CHECKLIST.md`** di root project — manual checklist untuk:
  - 4 Golden path per role (customer/reseller/vendor/admin) step-by-step
  - Cross-browser checks (Chrome/Edge/Firefox/Safari iOS)
  - Responsive breakpoint test (375/414/768/1024/1280/1920)
  - Accessibility quick checks
  - Access control manual verify
  - ErrorBoundary + NotFoundPage smoke
  - Performance spot check
  - Production deploy smoke (post Phase 13)

**Run test:**
```powershell
cd sdp-api
php artisan test
# Output: Tests:    41 passed (111 assertions)  Duration: ~1.8s
```

**File yang dibuat:**
- `sdp-api/database/factories/{Vendor,Category,Product}Factory.php`
- `sdp-api/database/factories/UserFactory.php` (+ role state helpers)
- `sdp-api/tests/Feature/{Auth,ProductBrowse,Checkout,MidtransWebhook,AccessControl}Test.php`
- `sdp-api/database/migrations/2026_05_12_115526_create_reseller_commissions_table.php` (status enum)
- `QA_CHECKLIST.md` di root project

---

### 🔲 Phase 13 — Deploy ke VPS
**Goal:** Marketplace live di VPS IDCloudHost.

- Setup VPS 157.10.161.83: PHP 8.2, MySQL 8, Nginx, Node 20, Supervisor
- Domain + SSL Let's Encrypt
- DB migrate + seed production (admin + settings only, no dummy data)
- `npm run build` → serve via Nginx static
- `composer install --no-dev` + `php artisan optimize`
- Supervisor: queue worker
- Cron: `php artisan schedule:run`
- Backup harian DB
- Update Midtrans: notification URL produksi
- Smoke test produksi end-to-end

---

### ✅ Phase 14 — Tier Loyalty System + Role Refactor
**Goal:** Customer dapat motivasi belanja via tier discount, admin bisa custom semua values; sistem role lebih bersih (drop `reseller`).

**Konsep:**
- 3 role: `admin`, `vendor_admin`, `customer` (sebelumnya 4, dropped `reseller`)
- Setiap `customer` dapat 2 benefit:
  1. **Diskon tier 10-30%** sesuai lifetime spending (Member/Silver/Gold/Platinum/VIP)
  2. **Komisi referral 10%** kalau downline-nya belanja (existing, sekarang available ke semua user)
- `price_reseller` di Product **dihapus total** — diskon hanya datang dari tier
- Setiap user otomatis dapat `reseller_code` (auto-generate saat register/seeder)

**Tier defaults (admin-editable di `/admin/settings`):**

| Tier | Nama | Min Spend | Diskon |
|---|---|---|---|
| 1 | Member | Rp 5.000.000 | 10% |
| 2 | Silver | Rp 10.000.000 | 15% |
| 3 | Gold | Rp 15.000.000 | 20% |
| 4 | Platinum | Rp 20.000.000 | 25% |
| 5 | VIP | Rp 25.000.000 | 30% |

**Implementasi:**

- ✅ Migrations modify in-place (belum production):
  - Role enum `users.role`: drop `reseller` → 3 nilai saja
  - Drop kolom `products.price_reseller`
  - Add kolom `orders.tier_discount` & `orders.tier_name` (snapshot saat order dibuat)
- ✅ 15 settings keys baru: `tier_{1..5}_{name,min_spend,discount}` + group "Tier Loyalty" di admin
- ✅ `App\Services\TierService`:
  - `tiers()` — load 5 tier sorted desc by min_spend
  - `userSpending(User)` — `SUM(orders.subtotal) WHERE status='completed'`
  - `userTier(User)` — tier object atau null
  - `nextTier(User)` — untuk progress display + remaining amount
  - `applyDiscount(subtotal, User)` — return `[subtotal_after, discount, tier]`
- ✅ `CheckoutController@store` inject TierService:
  - Apply diskon ke subtotal SEBELUM hitung shipping (free shipping pakai subtotal-after)
  - Simpan snapshot `tier_discount` & `tier_name` di order
  - Drop `$isReseller`, drop `price_reseller` branch
  - Referral lookup tanpa filter `role='reseller'` (semua user yang punya code)
- ✅ `UserResource` extend: `total_spending`, `tier`, `next_tier`
- ✅ `ProductResource` simplify: drop `effective_price` & `price_reseller`
- ✅ `OrderResource` tambah `tier_discount` & `tier_name`
- ✅ `AuthController@register` auto-generate `reseller_code` unique untuk semua user baru
- ✅ `ResellerController` drop `ensureReseller()` — semua authenticated user bisa akses
- ✅ `User` model drop `isReseller()`, `UserSeeder` drop 3 dummy reseller + customer dapat code
- ✅ Frontend `TierBadge` component (5 style varian per level + Crown/Award icon)
- ✅ `ProfilePage` **TierCard section premium**: badge tier aktif, total spending besar, progress bar ke next tier, list 5 tier dengan benefit (collapsible)
- ✅ `CheckoutPage` summary: tier badge + baris "Diskon Tier {name} (-{discount}%)" sebelum total
- ✅ `CartPage` summary: tier badge + estimasi diskon (client-side preview, backend validate)
- ✅ `OrderDetailPage` (account & admin) tampilkan tier discount snapshot di summary
- ✅ `AccountLayout` menu "Komisi" tampil untuk semua user (bukan hanya reseller)
- ✅ `AdminUsersPage` & backend `Admin\UserController` drop role `reseller`
- ✅ `AdminDashboardPage` & backend `referrers_count` (ganti dari `resellers_count` yang return 0)
- ✅ `VendorProductsPage` drop field `price_reseller` (form + validation)
- ✅ Copy update: "via reseller" → "via referral" di ReferralBadge/ReferralRedirectPage
- ✅ Tests: 41 → **49 tests pass (129 assertions)**:
  - Update `UserFactory`: drop `reseller()` state, default include `reseller_code`
  - Rewrite `test_reseller_code_creates_commission_pending` → `test_referrer_code_creates_commission_pending` (pakai user biasa)
  - Drop `test_reseller_gets_reseller_price_on_order`
  - Refactor `test_only_reseller_can_access_reseller_summary` → all authenticated users
  - **New `TierTest` (8 tests)**: no completed orders = no tier, tier 1 after 5jt, tier 3 after 15jt, top tier no next, only completed counts, discount applied at checkout, no discount below threshold, admin can modify thresholds

**Smoke test verified:**
- TierService via tinker → user customer1 (spending 0) → tier=NONE, next=Member need 5jt
- `migrate:fresh --seed` → 10 customer, 0 reseller, semua punya `reseller_code` unique
- Build sukses: vendor chunks unchanged, total chunks 60+ (route-split intact)

**File yang dibuat/diubah:**

Backend:
- **NEW** `sdp-api/app/Services/TierService.php`
- **NEW** `sdp-api/tests/Feature/TierTest.php`
- `sdp-api/database/migrations/2026_05_12_115519_add_role_and_reseller_to_users_table.php` (enum)
- `sdp-api/database/migrations/2026_05_12_115522_create_products_table.php` (drop price_reseller)
- `sdp-api/database/migrations/2026_05_12_115524_create_orders_table.php` (+ tier_discount, tier_name)
- `sdp-api/database/seeders/SettingsSeeder.php` (+ 15 tier keys)
- `sdp-api/database/seeders/UserSeeder.php` (drop reseller block, + reseller_code)
- `sdp-api/database/seeders/ProductSeeder.php` (drop price_reseller)
- `sdp-api/database/factories/UserFactory.php` (drop reseller state, default + reseller_code)
- `sdp-api/database/factories/ProductFactory.php` (drop price_reseller)
- `sdp-api/app/Models/{Order.php,Product.php,User.php}` (fillable/casts/helpers update)
- `sdp-api/app/Http/Controllers/Api/AuthController.php` (auto-gen reseller_code)
- `sdp-api/app/Http/Controllers/Api/CheckoutController.php` (inject TierService, drop reseller logic)
- `sdp-api/app/Http/Controllers/Api/ResellerController.php` (drop ensureReseller)
- `sdp-api/app/Http/Controllers/Api/Admin/{SettingController,UserController,DashboardController}.php`
- `sdp-api/app/Http/Controllers/Api/Vendor/ProductController.php` (drop price_reseller validation)
- `sdp-api/app/Http/Resources/{UserResource,ProductResource,OrderResource}.php`
- `sdp-api/tests/Feature/{CheckoutTest,AccessControlTest,MidtransWebhookTest}.php`

Frontend:
- **NEW** `src/components/TierBadge.jsx`
- `src/pages/account/ProfilePage.jsx` (+ TierCard section + collapsible tier list)
- `src/pages/CheckoutPage.jsx` (+ TierBadge + diskon line di summary)
- `src/pages/CartPage.jsx` (+ tier estimasi preview)
- `src/pages/account/OrderDetailPage.jsx` & `src/pages/admin/AdminOrderDetailPage.jsx` (+ tier_discount row)
- `src/pages/ProductDetailPage.jsx` & `src/components/ProductCard.jsx` (drop price_reseller branches)
- `src/pages/vendor/VendorProductsPage.jsx` (drop price_reseller form field)
- `src/pages/admin/AdminUsersPage.jsx` (drop reseller role from filter/badge/dropdown)
- `src/pages/admin/AdminDashboardPage.jsx` (Reseller → Referrer Aktif card)
- `src/layouts/AccountLayout.jsx` (menu Komisi untuk semua user)
- `src/stores/useCartStore.js` (drop effective_price reference)
- `src/components/ReferralBadge.jsx` & `src/pages/ReferralRedirectPage.jsx` (copy: "reseller" → "referral")

---

### ✅ Phase 15 — UX Polish + Payment + Invoice
**Goal:** Perbaikan tampilan, sistem pembayaran manual sementara, halaman toko vendor publik, dan invoice PDF premium.

**Perubahan UI/UX:**
- ✅ `ProductCard` — aspect ratio ubah dari `3/4` → `1/1` (square) untuk konsistensi grid
- ✅ `VendorProfilePage` — logo kini bisa **upload file langsung** (klik lingkaran logo → pilih file → upload ke Cloudinary/local) selain paste URL; spinner saat upload; hover overlay dengan ikon Upload
- ✅ `VendorProfilePage` — hapus field **Commission Rate** dari Info Akun (field tidak dipakai di sistem komisi)
- ✅ Navbar — tambah link **Panel Vendor** untuk role `vendor_admin` dan **Admin** untuk role `admin`

**Halaman Toko Publik Vendor:**
- ✅ **NEW** `src/pages/VendorPage.jsx` — halaman publik `/vendor/:slug`
  - Header: logo bulat + nama vendor + deskripsi + jumlah produk aktif
  - Grid produk 2-4 kolom (aspect square), pagination
  - Empty state jika tidak ada produk
  - Loading skeleton
- ✅ Route `/vendor/:slug` ditambahkan di `App.jsx`

**Sistem Pembayaran Manual (sementara — Midtrans akan disambung nanti):**
- ✅ Midtrans Snap **dinonaktifkan sementara** dari frontend (`OrderSuccessPage` — hapus `useSnapToken`, `loadSnap`, Snap popup)
- ✅ **Backend:** `POST /api/orders/{orderNumber}/confirm-payment` — customer konfirmasi bayar, order langsung `pending_payment` → `processing`
- ✅ **Frontend hook:** `useConfirmPayment()` di `useCheckout.js`
- ✅ **`OrderSuccessPage`** — tombol **"Saya Sudah Bayar"** menggantikan Snap popup
- ✅ **`OrderDetailPage`** (akun customer) — panel pembayaran ala Tokopedia saat status `pending_payment`:
  - Total tagihan besar + tombol **"Cek Status Pembayaran"** (refresh live dengan spinner)
  - Kotak rekening bank: nama bank, nomor rekening + tombol Salin, jumlah transfer + tombol Salin
  - Info notice transfer sesuai nominal
  - Tombol **"Konfirmasi Pembayaran"**
- ✅ Settings rekening bank baru: `bank_name`, `bank_account_number`, `bank_account_name` (group "Pembayaran" di AdminSettingsPage, exposed via `/api/settings/public`)
- ✅ `SettingsSeeder` — default: BCA / 1234567890 / PT SDP Marketplace

**Invoice PDF Premium:**
- ✅ **NEW** `src/pages/account/InvoicePage.jsx` — halaman standalone (tanpa Navbar/Footer)
  - Auto-trigger `window.print()` saat data siap (600ms delay)
  - Layout A4, monochrome premium typography
  - Header: brand name besar + tagline / nomor invoice + tanggal
  - Info: nama & alamat penerima / status badge Lunas atau Menunggu Pembayaran / kurir + resi
  - Tabel produk: nama, brand, harga satuan, qty, subtotal (zebra stripe)
  - Ringkasan: subtotal, diskon tier (jika ada), ongkir, **total bold**
  - Instruksi transfer (hanya tampil jika belum lunas) dengan info rekening dari settings
  - Footer ucapan terima kasih + tanggal generate
  - Tombol "Download / Print PDF" + "Kembali" (hilang saat print)
  - CSS `@media print`: warna exact, hilangkan tombol, A4 page size
- ✅ Route `/akun/pesanan/:orderNumber/invoice` — **di luar AppShell** (tidak ada Navbar/Footer)
- ✅ Tombol **Invoice** (ikon FileText) di `OrderDetailPage` → buka tab baru

**File yang dibuat/diubah:**

Backend:
- `sdp-api/app/Http/Controllers/Api/PaymentController.php` (+ `confirmPayment()`)
- `sdp-api/app/Http/Controllers/Api/SettingController.php` (+ 3 bank keys di publicKeys)
- `sdp-api/app/Http/Controllers/Api/Admin/SettingController.php` (+ 3 bank KNOWN_KEYS, group "Pembayaran")
- `sdp-api/database/seeders/SettingsSeeder.php` (+ bank_name, bank_account_number, bank_account_name)
- `sdp-api/routes/api.php` (+ `POST /orders/{orderNumber}/confirm-payment`)

Frontend:
- **NEW** `src/pages/VendorPage.jsx`
- **NEW** `src/pages/account/InvoicePage.jsx`
- `src/hooks/useCheckout.js` (+ `useConfirmPayment`)
- `src/pages/OrderSuccessPage.jsx` (rewrite: drop Snap, + tombol konfirmasi)
- `src/pages/account/OrderDetailPage.jsx` (+ panel pembayaran Tokopedia-style + tombol Invoice)
- `src/pages/vendor/VendorProfilePage.jsx` (+ upload logo langsung, hapus commission_rate display)
- `src/components/ProductCard.jsx` (aspect-square)
- `src/App.jsx` (+ VendorPage route, + InvoicePage route standalone di luar AppShell)

---

### ✅ Phase 16 — Email Verifikasi + Midtrans Snap + Cancel Order + Commission Withdrawal
**Goal:** Sistem lebih lengkap: verifikasi email wajib, payment Midtrans aktif, customer bisa batalkan pesanan, reseller bisa tarik komisi.

**Email Verifikasi (commit `bc1f84d`):**
- ✅ Backend `EmailVerificationController`:
  - `GET /api/auth/email/verify/{id}/{hash}` (signed URL) — verifikasi email, set `email_verified_at`
  - `POST /api/auth/email/resend` — kirim ulang email verifikasi
- ✅ Middleware `EnsureEmailVerified` di route yang perlu (checkout, akun)
- ✅ `VerifyEmailPage` — instruksi cek email + tombol kirim ulang
- ✅ `EmailVerifiedPage` — halaman sukses setelah klik link di email
- ✅ `RegisterPage` — setelah register langsung redirect ke `/verify-email?email=...`
- ✅ Semua akun seeder diberi `email_verified_at` agar lokal tidak perlu verifikasi manual
- ✅ 19 akun lokal sudah diverifikasi manual via tinker (2026-05-19)

**Referral Network & Checkout Fix (commit `bc1f84d`, `8fd10a9`):**
- ✅ `ReferralRedirectPage` — `/r/:code` redirect ke `/register?ref={code}` (bukan simpan localStorage)
- ✅ `RegisterPage` — field kode referral opsional, terisi otomatis dari URL param `?ref=`
- ✅ `CheckoutController` — referrer dari `user.referrer_id` (permanen dari registrasi), bukan input checkout
- ✅ `CheckoutPage` — hapus semua kode referral input & `useReferralStore`
- ✅ `ResellerDashboardPage` — link referral sekarang `/register?ref={code}`
- ✅ Hapus `useReferralStore` & `ReferralBadge` dari AppShell
- ✅ `AccountLayout` — menu Komisi tampil untuk semua user (bukan hanya reseller)

**Midtrans Snap Reaktivasi (commit `26fc0d1`):**
- ✅ Midtrans Snap **kembali aktif** — sandbox keys sudah ada di `sdp-api/.env`
- ✅ Flow checkout baru: klik "Bayar Sekarang" di checkout → create order → langsung buka Snap popup → setelah bayar → `/order/sukses/:orderNumber?paid=1` (tampil "Pembayaran Berhasil!" langsung)
- ✅ Jika Snap ditutup tanpa bayar → redirect ke `/akun/pesanan/:orderNumber` untuk bayar nanti
- ✅ `OrderSuccessPage` — handle `?paid=1` param untuk langsung tampil success state tanpa tombol bayar; jika diakses manual dan masih pending → tampil tombol "Bayar Sekarang"
- ✅ `GET /api/orders/{orderNumber}/check-status` — fallback cek status ke Midtrans langsung (tanpa webhook); tombol "Cek Status" di OrderDetailPage memanggil endpoint ini
- ✅ Snap token retry: jika order_id sudah ada di Midtrans → auto-cancel transaksi lama lalu buat token baru
- ✅ `OrderDetailPage` — tombol "Bayar Sekarang" (Snap popup) + "Cek Status" untuk pesanan `pending_payment`
- ✅ `onSuccess` callback snap → auto-call check-status untuk update order di DB tanpa tunggu webhook

**Cancel Order (commit `26fc0d1`):**
- ✅ `POST /api/orders/{orderNumber}/cancel` — customer batalkan pesanan `pending_payment` saja:
  - Restore stok semua item
  - Cancel komisi reseller terkait (status → `cancelled`)
  - Update order status → `cancelled`
- ✅ Tombol "Batalkan Pesanan" di `OrderDetailPage` dengan modal konfirmasi
- ✅ Hanya muncul saat status `pending_payment`; hilang otomatis setelah status berubah

**Commission Withdrawal (commit `26fc0d1`):**
- ✅ **Migration baru:** `commission_withdrawals` table:
  - `user_id`, `amount`, `bank_name`, `bank_account_number`, `bank_account_name`
  - `notes` (opsional dari user), `status` (`pending`|`approved`|`rejected`)
  - `admin_notes`, `processed_at`
- ✅ **Backend:**
  - `POST /api/reseller/withdrawals` — ajukan penarikan; validasi saldo `earned` cukup; tolak jika masih ada withdrawal `pending`
  - `GET /api/reseller/withdrawals` — list riwayat penarikan user
  - `GET /api/admin/withdrawals` — list semua withdrawal + filter status + summary pending count
  - `PUT /api/admin/withdrawals/{id}/status` — admin approve/reject + `admin_notes`
- ✅ **Frontend user** (`ResellerDashboardPage`):
  - Tombol "Tarik Komisi" di header — disable jika saldo `earned` = 0 atau ada withdrawal pending
  - Tab baru "Penarikan" — riwayat withdrawal dengan status (Diproses/Disetujui/Ditolak) + admin_notes
  - Modal form: jumlah, nama bank, nomor rekening, nama pemilik rekening, catatan opsional
  - Saldo yang bisa ditarik = total komisi status `earned`
- ✅ **Frontend admin** (`AdminWithdrawalsPage` — halaman baru terpisah):
  - Menu "Penarikan" di AdminLayout sidebar
  - List request + filter status + summary pending count
  - Tombol Setuju/Tolak per row dengan modal konfirmasi + kolom admin notes
  - Transfer uang tetap **manual** di luar sistem; sistem hanya tracking request

**Perbaikan Lain (commit `26fc0d1`):**
- ✅ `AdminCommissionsPage` — tambah search input (by nama reseller/customer) dengan debounce 400ms; backend filter via `whereHas` ke relasi reseller/customer
- ✅ **Invoice fix** — `fetchMe` (auth init) dipindah dari `AppShell` ke level `App` agar halaman invoice (di luar AppShell) tidak stuck loading selamanya di spinner

**File yang dibuat/diubah:**

Backend:
- **NEW** `sdp-api/app/Http/Controllers/Api/EmailVerificationController.php`
- **NEW** `sdp-api/database/migrations/2026_05_19_073014_create_commission_withdrawals_table.php`
- **NEW** `sdp-api/app/Models/CommissionWithdrawal.php`
- **NEW** `sdp-api/app/Http/Controllers/Api/ResellerWithdrawalController.php`
- **NEW** `sdp-api/app/Http/Controllers/Api/Admin/WithdrawalController.php`
- `sdp-api/app/Http/Controllers/Api/PaymentController.php` (+ `checkStatus()`, snap retry logic)
- `sdp-api/app/Http/Controllers/Api/OrderController.php` (+ `cancel()`)
- `sdp-api/app/Http/Controllers/Api/Admin/CommissionController.php` (+ `search` filter)
- `sdp-api/app/Services/MidtransService.php` (+ `checkTransactionStatus()`, retry on 400)
- `sdp-api/database/seeders/UserSeeder.php` (+ `email_verified_at` semua akun)
- `sdp-api/routes/api.php` (+ email verify, cancel, check-status, withdrawal routes)

Frontend:
- **NEW** `src/pages/VerifyEmailPage.jsx`
- **NEW** `src/pages/EmailVerifiedPage.jsx`
- **NEW** `src/pages/admin/AdminWithdrawalsPage.jsx`
- `src/pages/RegisterPage.jsx` (+ ref_code field, redirect ke verify-email)
- `src/pages/ReferralRedirectPage.jsx` (redirect ke /register?ref=)
- `src/pages/OrderSuccessPage.jsx` (+ Midtrans Snap flow + `?paid=1` handler)
- `src/pages/CheckoutPage.jsx` (+ buka Snap langsung setelah create order)
- `src/pages/account/OrderDetailPage.jsx` (+ Bayar Sekarang + Batalkan Pesanan + Cek Status)
- `src/pages/account/ResellerDashboardPage.jsx` (+ tab Penarikan + modal Tarik Komisi)
- `src/pages/admin/AdminCommissionsPage.jsx` (+ search input reseller/customer)
- `src/hooks/useCheckout.js` (+ `useCancelOrder`)
- `src/hooks/useReseller.js` (+ `useResellerWithdrawals`, `useSubmitWithdrawal`)
- `src/hooks/useAdmin.js` (+ `useAdminWithdrawals`, `useUpdateWithdrawalStatus`)
- `src/layouts/AdminLayout.jsx` (+ menu Penarikan)
- `src/App.jsx` (+ auth init di level App, + AdminWithdrawalsPage route)

---

## Data Dummy (Seeder)

### Akun Login

| Role | Email | Password | Keterangan |
|---|---|---|---|
| Admin | `admin@sdp.local` | `password` | Full access ke semua panel |
| Vendor Admin | `lumiere-studio@vendor.sdp.local` | `password` | Kelola Lumière Studio |
| Vendor Admin | `kanaya-beauty@vendor.sdp.local` | `password` | Kelola Kanaya Beauty |
| Vendor Admin | `aksen-pria@vendor.sdp.local` | `password` | Kelola Aksen Pria |
| Vendor Admin | `mini-mochi@vendor.sdp.local` | `password` | Kelola Mini Mochi |
| Vendor Admin | `atelier-goods@vendor.sdp.local` | `password` | Kelola Atelier Goods |
| Vendor Admin | `starinc@sdp.local` | `password` | Kelola STARINC |
| Customer | `customer1@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer2@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer3@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer4@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer5@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer6@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer7@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer8@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer9@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |
| Customer | `customer10@sdp.local` | `password` | Punya `reseller_code` (auto-generated) untuk referral link |

> Role `reseller` sudah dihapus di Phase 14. Semua user customer otomatis dapat `reseller_code` untuk referral, dan dapat tier discount sesuai total spending (lihat Phase 14).

---

### Vendor & Produk

| Vendor | Slug | Kategori Produk | Jumlah |
|---|---|---|---|
| Lumière Studio | `lumiere-studio` | Wanita (Atasan, Bawahan, Dress, Outerwear) | 8 |
| Kanaya Beauty | `kanaya-beauty` | Beauty (Skincare, Makeup, Body Care, Fragrance) | 8 |
| Aksen Pria | `aksen-pria` | Pria (Kaos, Kemeja, Celana, Jaket) | 8 |
| Mini Mochi | `mini-mochi` | Anak (Baju Bayi, Mainan) | 4 |
| Atelier Goods | `atelier-goods` | Aksesoris (Tas, Sepatu, Topi, Jam Tangan) | 7 |

**Total: 35 produk**, masing-masing punya 3 gambar (Picsum Photos). Sekitar 25% produk punya diskon acak 25%.

---

### Kategori (Hierarkis)

| Parent | Children |
|---|---|
| Wanita | Atasan, Bawahan, Dress, Outerwear |
| Pria | Kaos, Kemeja, Celana, Jaket |
| Beauty | Skincare, Makeup, Body Care, Fragrance |
| Anak | Baju Bayi, Mainan |
| Aksesoris | Tas, Sepatu, Topi, Jam Tangan |
| Sport | Pakaian Olahraga, Peralatan |
| Rumah | Dekorasi, Dapur |
| Gadget | Aksesoris HP, Audio |

---

### Settings

| Key | Value | Keterangan |
|---|---|---|
| `reseller_commission_rate` | `10` | Komisi reseller 10% (global) |
| `shipping_min_free` | `150000` | Gratis ongkir min. Rp 150.000 |
| `shipping_flat_default` | `15000` | Ongkir default Rp 15.000 |
| `site_name` | `SDP Marketplace` | Nama situs |
| `site_tagline` | `Marketplace multi-brand pilihan kamu` | Tagline |
| `announce_bar_1` | `Gratis Ongkir min. Rp 150.000` | Info bar atas |
| `announce_bar_2` | `Brand baru hadir setiap minggu` | Info bar atas |
| `whatsapp_cs` | `+6281234567890` | Nomor CS |

---

## Cara Reset Data Dummy

```bash
cd sdp-api
php artisan migrate:fresh --seed
```

Ini akan menghapus semua data dan mengisi ulang dari seeder.

---

## Cara Jalankan Project (Dev)

```bash
# Backend (terminal 1)
cd sdp-api
php artisan serve --host=127.0.0.1 --port=8001

# Frontend (terminal 2)
npm run dev
# → http://127.0.0.1:5174
```

API base URL: `http://127.0.0.1:8001/api`
