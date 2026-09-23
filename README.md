# SDP Marketplace

Marketplace multi-brand — vendor terkurasi (invite-only) jual produk masing-masing dalam satu platform, dengan sistem komisi referral dan tier loyalty untuk customer. Terpisah sepenuhnya dari proyek STARINC.

## Stack

| Bagian | Teknologi | Port |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | `5174` |
| Backend | Laravel 13 + Sanctum (`sdp-api/`) | `8001` |
| Database | MySQL `sdp_db` | — |
| Payment | Midtrans Snap (sandbox) | — |
| Ongkir | RajaOngkir (domestik) + weight-tier internasional | — |

## Menjalankan Secara Lokal

### Prasyarat
- Node.js, PHP 8.2+, Composer, MySQL

### Frontend
```bash
npm install
npm run dev        # http://127.0.0.1:5174
```

### Backend
```bash
cd sdp-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8001
```

Frontend butuh `.env` berisi `VITE_API_URL` dan `VITE_STORAGE_URL` mengarah ke backend (`http://127.0.0.1:8001`).

### Akun Test
| Role | Email | Password |
|---|---|---|
| Admin | admin@sdp.local | password |

## Struktur Proyek

```
SDP/
├── src/                  # Frontend React (pages, components, stores, hooks)
│   ├── pages/            # customer, account, admin, vendor
│   ├── components/
│   └── stores/
├── sdp-api/               # Backend Laravel
│   ├── app/Http/Controllers
│   ├── app/Services        # RegionalPriceService, InternationalShippingService, dll
│   ├── app/Models
│   └── database/migrations
├── openclaw-mcp/          # MCP server read-only untuk query data via AI assistant (personal use)
└── openclaw-plugin/       # alternatif ke openclaw-mcp (tidak direferensikan aktif)
```

## Arsitektur Ringkas

### Role User
- `customer` — pembeli, otomatis dapat kode referral & bisa jadi reseller aktif
- `vendor_admin` — kelola produk vendor sendiri
- `admin` — full access

### Sistem Komisi Referral
- Kode referral diinput saat **register** (`referrer_id` permanen)
- Komisi berjalan berdasar `referrer_id`/`reseller_code`, bukan `users.role` — siapa pun bisa jadi referrer
- Rate global dari `settings.reseller_commission_rate` (saat ini 5%)
- 1-layer saja (bukan MLM)
- Status: `pending` → `earned` → penarikan lewat `commission_withdrawals`

### Tier Loyalty
- 5 tier (Member–VIP), diskon 10–30% berdasar total belanja `completed`
- Customer baru mulai di tier Gold (20%)

### Vendor
- Admin-curated (invite-only), setiap vendor punya slug, logo, storefront publik di `/vendor/:slug`

### Localized Storefront (regional)
- Deteksi negara: `GeoLocationService` (MaxMind GeoLite2 lokal)
- Region & currency: `config/regions.php` (ID/AU/IN/PH)
- Harga regional: `RegionalPriceService` + `product_regional_prices`, ditentukan negara tujuan kirim saat checkout
- Kurs: `ExchangeRateService` (fetch berkala, cache 15 menit, tampilan saja — order tetap dibayar IDR)
- Ongkir internasional: `InternationalShippingService` + `shipping_rates` (weight-tier)

### Payment
- Midtrans Snap (sandbox) — checkout create order → Snap popup → halaman sukses
- Webhook: `POST /payments/notification`

## API

Base URL: `http://127.0.0.1:8001/api`, auth via Laravel Sanctum (Bearer token).

Grup route utama: `auth` (`/login`, `/register`, `/me`, dll), `products`, `categories`, `vendors`, `orders`, `checkout`, `reseller/*`, `commissions`, `withdrawals`, `storefront/*` (region & reprice), `shipping-rates`, `rajaongkir/*`, `reviews`, `wishlist`, `addresses`, `settings`, `users`, `activity-logs`.

## Catatan Penting

- **Dua controller checkout** (`CheckoutController` untuk user login, `GuestCheckoutController` untuk guest) — perubahan logika ongkir/checkout wajib diterapkan di keduanya (belum diekstrak ke service bersama).
- OpenClaw MCP integration (`openclaw-mcp/`) bersifat personal-use, read-only, untuk 1 device — jangan expose token/endpoint ke publik.

## Dokumentasi Lain

- [`RINGKASAN_STATUS.md`](RINGKASAN_STATUS.md) — snapshot status & progress terbaru
- [`ROADMAP.md`](ROADMAP.md) — riwayat phase development lengkap
- [`PLAN_NEXT.md`](PLAN_NEXT.md) — rencana kerja fase berikutnya
- [`PRODUCT.md`](PRODUCT.md) — product purpose, brand personality, design principles
- [`DESIGN.md`](DESIGN.md) / [`DESIGN_GUIDELINES.md`](DESIGN_GUIDELINES.md) — sistem desain
- [`QA_CHECKLIST.md`](QA_CHECKLIST.md) — checklist testing
- [`CLAUDE.md`](CLAUDE.md) — instruksi kerja untuk Claude Code di proyek ini
