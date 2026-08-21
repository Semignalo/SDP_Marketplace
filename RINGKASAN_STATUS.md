# SDP — Ringkasan Proyek & Status

> Dibuat: 11 Agustus 2026 — snapshot kondisi terkini (gabungan ROADMAP.md, PLAN_NEXT.md, git log, memory). ROADMAP.md & PLAN_NEXT.md sudah disinkronkan ke commit terakhir pada tanggal yang sama.

---

## 1. Apa itu SDP?

**SDP** = marketplace multi-brand (terpisah total dari STARINC). Beberapa vendor jual produk masing-masing di satu platform, ada sistem komisi referral, dan tier loyalty untuk customer.

| Aspek | Detail |
|---|---|
| Frontend | React + Vite + Tailwind, port `5174` |
| Backend | Laravel 13 + Sanctum, folder `sdp-api/`, port `8001` |
| DB lokal | MySQL `sdp_db` |
| Produksi | VPS IDCloudHost `157.10.161.83`, domain `marketplace.starincofficial.id` |
| Repo | github.com/Semignalo/SDP_Marketplace (branch `main`) |

**3 role user:** `customer`, `vendor_admin`, `admin` (role `reseller` sudah dihapus — semua customer otomatis dapat referral code + komisi 10% + diskon tier).

**Model bisnis inti:**
- Vendor **invite-only** oleh admin, tiap vendor kelola produk sendiri (`vendor_admin`)
- Customer dapat **diskon tier** (Member–VIP, 10–30%) berdasar total belanja `completed`
- Customer dapat **komisi referral 10%** kalau downline-nya belanja (1 layer, bukan MLM)
- Pembayaran via **Midtrans Snap** (sandbox aktif)
- Order internasional: ongkir manual dulu (admin cek harga ke pihak ketiga "OGB", input manual) — sedang dibangun opsi **express otomatis**

---

## 2. Update Sampai Mana (posisi sekarang)

**Branch aktif:** `feat/admin-order-filters-openclaw-mcp`

**5 commit terakhir:**
1. Fix — order internasional gak lagi ke-cancel otomatis sebelum sempat dibayar
2. Fix — dropdown filter negara jangan hilang saat baru ada 1 negara
3. Feat — filter & sort pesanan di admin + integrasi OpenClaw read-only
4. Feat — auto-cancel window jadi configurable (`settings.order_auto_cancel_hours`)
5. Fix — nama guest & kurs custom tampil di admin, rapikan invoice PDF

**Ada kerjaan belum di-commit** (staged di working tree, belum jadi commit):
- Tabel `shipping_rates` (model `ShippingRate` + migration + seeder) — skema **weight-tier** (negara, zona, berat, dimensi, service BASIC/EXPRESS, term DDP/DDU, base_rate, FSC%, ESC, biaya custom, fee OGB), diseed dari data quote asli spreadsheet **"QUOTING - OGB X STARINC.xlsx"**.
- **Belum dipakai** di checkout/admin manapun — baru fondasi data untuk fitur ongkir express (Phase 18), belum ada service/endpoint/UI yang membacanya.

---

## 3. Sudah Dikerjakan (Phase 1–21, semua ✅ selesai)

| Phase | Isi |
|---|---|
| 1–2 | Backend foundation, auth, browse API produk/kategori/vendor |
| 3–4 | Design system + halaman publik (home, produk, detail) |
| 5–6 | Akun customer (profil, alamat, wishlist) + cart & checkout |
| 7 | Midtrans Snap (payment online) |
| 8 | Fitur reseller/referral (komisi, dashboard, link) |
| 9–10 | Panel Vendor + Panel Admin (full CRUD semua resource) |
| 11–12 | Polish UX (code splitting, error boundary, 404) + 41 test PHPUnit |
| 14 | Tier Loyalty (5 tier Member–VIP) + hapus role `reseller` |
| 15 | Payment manual sementara, halaman toko vendor publik, invoice PDF |
| 16 | Verifikasi email, Midtrans reaktif, cancel order, penarikan komisi |
| 17 | RajaOngkir integration + tier enhancement, ongkir zona domestik + scaling per kg |
| — | Komisi 5%, harga member di listing, tier override admin, activity log |
| — | Surat jalan PDF, quantity manual input, resi manual, badge notifikasi |
| — | Guest checkout, currency toggle USD/IDR, forgot/reset password |
| — | Redesign UI/UX besar-besaran + kuotasi ongkir internasional manual (`awaiting_quote`) |
| 17 (baru) | Admin: filter negara, sort kolom, search nama pemesan (termasuk guest) |
| 21 | Integrasi OpenClaw read-only (endpoint `/api/assistant/*` + MCP server di `openclaw-mcp/`) — dipakai Stefan sendiri untuk query data via AI assistant |

Detail lengkap per phase ada di `ROADMAP.md` (sekarang mencakup Phase 1–29, sudah disinkronkan 11 Agustus 2026) dan `PLAN_NEXT.md` (Phase 17–21 versi plan kerja, numbering-nya beda sendiri — lihat catatan di file itu).

---

## 4. Yang Perlu Dikerjakan

### 🔴 Belum dikerjakan sama sekali
- **Phase 13 — Deploy ke VPS versi lengkap**: setup Nginx/Supervisor/cron/backup harian, `composer install --no-dev`, smoke test produksi end-to-end. *(Catatan: server VPS sudah live & di-hardening dari sisi security, tapi checklist deploy formal di ROADMAP belum ditandai selesai — perlu dicek ulang statusnya.)*
- **Midtrans production keys** — masih sandbox, belum switch ke mode production
- **Webhook Midtrans URL publik** — belum dikonfigurasi di dashboard Midtrans

### 🟡 Sedang berjalan / setengah jalan
- **Phase 18 — Ongkir Express Internasional**: data rate (`shipping_rates`) sudah ada di working tree tapi **belum di-commit** dan **belum disambung** ke:
  - Service hitung ongkir (`InternationalShippingService` belum dibuat)
  - Endpoint quote (`POST /shipping/international-quote` belum ada)
  - Checkout UI (pilihan Express vs Normal belum ada di `CheckoutController` & `GuestCheckoutController`)
  - Admin CRUD rate (halaman kelola `shipping_rates` belum dibuat)

### ⏸️ Menunggu pihak eksternal (OGB)
- **Phase 19 — Kurs realtime USD→IDR** (hanya perlu kalau rate OGB dalam USD)
- **Phase 20 — Otomasi spreadsheet OGB** (butuh izin akses API/service-account ke sheet OGB — belum ditanyakan/dijawab)

### 🟢 Ide tercatat, belum mulai
- Hapus kolom `commission_rate` yang unused di tabel `vendors`
- Review keamanan tambahan VPS: sudo passwordless STARINC (opsional, disarankan skip), security headers HTTP (HSTS dll)

---

## 5. Hal Penting yang Perlu Diingat

- **Dua controller checkout** (`CheckoutController` untuk user login, `GuestCheckoutController` untuk guest) — setiap perubahan logika ongkir/checkout **wajib diterapkan di keduanya**, kalau tidak perilaku guest akan beda.
- Skema `shipping_rates` sengaja detail (weight-tier, bukan flat) karena mengikuti struktur asli data OGB — lebih akurat dari rencana awal "flat per negara" di `PLAN_NEXT.md`, tapi berarti logika hitung ongkir nanti perlu pilih rate tier berat yang sesuai, bukan sekadar `base_cost + per_kg`.
- OpenClaw integrasi = **personal use only** (Stefan, read-only, 1 device) — jangan expose token/endpoint ke publik.
