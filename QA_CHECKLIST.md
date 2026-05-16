# SDP Marketplace — QA Checklist Manual

> Untuk dijalankan setiap akan release / setelah perubahan besar.
> Backend feature tests (41 tests, 111 assertions) sudah handle alur API. Checklist ini fokus ke UX & cross-browser.

---

## Setup

1. Backend: `cd sdp-api && php artisan migrate:fresh --seed && php artisan serve --port=8001`
2. Frontend: `npm run dev` (port 5174)
3. Pastikan `.env` punya `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` (sandbox)

---

## Golden Path 1 — Customer (end-to-end)

Login: `customer1@sdp.local` / `password`

- [ ] Buka [127.0.0.1:5174](http://127.0.0.1:5174) — hero, brand strip, category grid, featured products tampil
- [ ] Klik produk → detail page muncul (gallery, harga, qty selector, deskripsi)
- [ ] Tambah ke cart → toast sukses, badge cart bertambah
- [ ] Klik icon cart → drawer kanan terbuka dengan item
- [ ] Klik "Checkout" di drawer → halaman `/checkout`
- [ ] Step 1: pilih alamat (atau tambah baru via modal)
- [ ] Step 2: pilih kurir (cek free shipping bar progress kalau subtotal < 150k)
- [ ] Step 3: review → klik "Bayar Sekarang"
- [ ] Redirect ke `/order/sukses/{nomor}` → tombol "Bayar Sekarang"
- [ ] Klik bayar → popup Midtrans Snap muncul
- [ ] Pilih CC test: `4811 1111 1111 1114`, CVV `123`, exp `01/30`, OTP `112233`
- [ ] Setelah sukses → status order otomatis update ke "Diproses" (polling 4 detik)
- [ ] Cek `/akun/pesanan` → order muncul di history dengan status benar
- [ ] Klik order → detail lengkap dengan alamat, kurir, item

## Golden Path 2 — Reseller

Login: `reseller-ayu@sdp.local` / `password`

- [ ] Buka `/akun/komisi` → dashboard tampil dengan referral link
- [ ] Klik tombol "Salin" → link tersalin ke clipboard
- [ ] Buka link `/r/{reseller_code}` di **incognito** → banner referral muncul di atas Navbar
- [ ] Login customer di tab yang sama → cart kosong, tapi banner masih ada
- [ ] Checkout → step review menampilkan "Pesanan ini terhubung ke reseller {CODE}"
- [ ] Selesaikan pembayaran
- [ ] Login balik ke reseller-ayu → `/akun/komisi` → tabel komisi bertambah, status `pending`

## Golden Path 3 — Vendor Admin

Login: `lumiere-studio@vendor.sdp.local` / `password`

- [ ] Otomatis redirect ke `/vendor` (Dashboard)
- [ ] KPI cards tampil, bar chart 30 hari render (hover tooltip)
- [ ] Top produk muncul kalau ada penjualan
- [ ] Klik "Produk" → list produk vendor (Lumière Studio saja)
- [ ] Klik "Tambah Produk" → modal CRUD muncul dengan form lengkap
- [ ] Isi semua field, tambahkan 1-2 URL gambar, save → produk muncul di list
- [ ] Edit produk → modal terisi dengan data existing
- [ ] Hapus produk (yang dummy) → konfirmasi → produk hilang
- [ ] "Pesanan" → list pesanan yang ada item vendor ini
- [ ] Klik detail pesanan → input nomor resi → tombol "Simpan & Tandai Dikirim" (kalau status processing)
- [ ] "Profil Toko" → edit nama/logo/deskripsi → save → tersimpan

## Golden Path 4 — Admin

Login: `admin@sdp.local` / `password`

- [ ] Otomatis redirect ke `/admin` (Dashboard)
- [ ] 8 KPI cards muncul, bar chart 30 hari render, top vendor & top produk
- [ ] `/admin/users` → list semua user, filter role, edit user (ubah role/password)
- [ ] `/admin/vendors` → tambah vendor baru dengan form (auto-create vendor_admin user dengan password yang diset)
  - [ ] Coba login vendor baru di tab incognito dengan email + password yang baru dibuat → harus bisa & redirect ke `/vendor`
- [ ] `/admin/categories` → tambah kategori parent + child, edit, hapus
- [ ] `/admin/products` → list cross-vendor, ubah status via inline select
- [ ] `/admin/orders` → list semua order, klik detail
- [ ] `/admin/pesanan/{nomor}` → ubah status (misal cancel) → cek auto-cancel commission terkait
- [ ] `/admin/commissions` → bulk select beberapa → "Tandai Paid" → konfirmasi → status berubah
- [ ] `/admin/settings` → edit "Rate Komisi Reseller (%)" → save → cek di reseller commission calculation order baru ikut rate baru

---

## Cross-Browser

Test minimal: Chrome (latest), Edge (latest), Firefox (latest), Safari (kalau ada Mac/iPhone).

- [ ] Homepage load tanpa layout shift
- [ ] Cart drawer animasi smooth
- [ ] Checkout multi-step responsive
- [ ] Snap popup Midtrans muncul di semua browser
- [ ] Form input behavior konsisten (focus ring, error inline)

## Responsive (Chrome DevTools)

Test breakpoint: 375px (iPhone SE), 414px (iPhone Pro), 768px (iPad), 1024px (iPad landscape), 1280px (desktop), 1920px (full HD).

- [ ] MobileBottomNav muncul di < 1024px, hidden di lg+
- [ ] Navbar hamburger muncul di mobile, search bar muncul di lg+
- [ ] Filter sidebar (products page) jadi Drawer di mobile, sidebar di desktop
- [ ] Product grid: 2 kol mobile, 3 kol tablet, 4 kol desktop
- [ ] Cart drawer fullscreen di mobile vs right-side di desktop
- [ ] Account/Vendor/Admin sidebar collapse jadi top di mobile

## Accessibility Quick Checks

- [ ] Tab pertama dari halaman → skip-link "Lewati ke konten utama" muncul
- [ ] Semua interactive element punya focus ring visible (ink color)
- [ ] Modal close via Esc key
- [ ] Drawer close via overlay click
- [ ] Image semua punya `alt` attribute
- [ ] Form input punya label terkait
- [ ] Color contrast lulus WCAG AA (ink #0a0a0a on paper #fff = 19:1 ✓)

## Access Control (manual verify)

- [ ] Logout → coba akses `/akun/profil` → redirect ke `/login?next=...`
- [ ] Login sebagai customer → coba akses `/vendor` → redirect ke `/`
- [ ] Login sebagai customer → coba akses `/admin` → redirect ke `/`
- [ ] Login vendor A → coba edit URL `/vendor/produk/{id-vendor-B}` → harus 403

## Error Boundary

- [ ] Sengaja set localStorage `sdp-cart` ke JSON invalid → reload → ErrorBoundary catch + fallback UI tampil
- [ ] Klik tombol "Refresh" di error UI → page reload
- [ ] Hit URL random `/asdfasdf` → NotFoundPage 404 tampil dengan path yang ke-quote

## Performance Spot Check

- [ ] First load home: < 2 detik di 4G throttle (DevTools → Network → Slow 4G)
- [ ] Initial JS gzip ≤ 150 KB (check Network tab; vendor chunks ~120 KB)
- [ ] Lazy chunks load on-demand (cek Network saat navigate)
- [ ] No layout shift saat image load (gunakan aspect-ratio)

## Production Deploy Smoke (setelah Phase 13)

- [ ] HTTPS aktif & valid (Let's Encrypt)
- [ ] Domain root redirect ke www (atau sebaliknya, konsisten)
- [ ] Database migrate sukses, seed admin saja (no dummy)
- [ ] Midtrans notification URL di dashboard → `https://yourdomain/api/payments/notification`
- [ ] Test real payment dengan minimal amount (Rp 10.000)
- [ ] Cek webhook diterima: cek log `storage/logs/laravel.log` ada entry "Midtrans webhook processed"
- [ ] Backup harian DB scheduled di cron
- [ ] Supervisor untuk queue worker (kalau email notif diaktifkan)

---

## Hasil Test Otomatis (PHPUnit)

```bash
cd sdp-api && php artisan test
```

Latest: **41 tests, 111 assertions, all passed** ✓

- `AuthTest` (7) — register/login/logout/me + validation
- `ProductBrowseTest` (8) — list/filter/search/detail/inactive-hidden
- `CheckoutTest` (10) — create order, stock, shipping, commission, validation
- `MidtransWebhookTest` (8) — status mapping, idempotent, commission sync, 503 fallback
- `AccessControlTest` (8) — vendor/admin/reseller scope
