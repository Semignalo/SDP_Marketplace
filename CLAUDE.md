# CLAUDE.md — SDP Marketplace

## Communication Style

- Balas dalam Bahasa Indonesia
- Jawaban singkat dan padat
- "oke" = lanjutkan langsung
- User pakai Windows 11 — pakai `127.0.0.1` bukan `localhost`

---

## Project Overview

**SDP** adalah marketplace multi-brand. Terpisah sepenuhnya dari **STARINC** (`C:\laragon\www\STARINC\`).

| Aspek | Detail |
|---|---|
| Frontend | React + Vite, port `5174` |
| Backend | Laravel 13, port `8001` (`sdp-api/`) |
| Database lokal | MySQL `sdp_db`, password root kosong |
| VPS | IDCloudHost `157.10.161.83`, user `STARINC` |

## Commands

### Frontend (root)
```bash
npm run dev      # port 5174
npm run build
```

### Backend (sdp-api/)
```bash
php artisan serve --port=8001
php artisan migrate:fresh --seed
php artisan make:model NamaModel
```

---

## Architecture

### User Roles
- `customer` — pembeli biasa
- `reseller` — dapat komisi flat % dari order via referral link
- `vendor_admin` — kelola produk vendor sendiri
- `admin` — full access

### Commission System
- **Flat % global** — 1 angka berlaku semua reseller & semua brand
- Konfigurasi di tabel `settings` key `reseller_commission_rate`
- Reseller dapat komisi kalau customer checkout via referral link/code mereka
- Status: `pending` → `paid` (admin mark paid)

### Vendor Model
- **Admin-curated (invite only)** — admin invite vendor, tidak ada open signup
- Setiap vendor punya `slug` unik, logo, dan produk sendiri
- `vendor_admin` hanya bisa manage produk vendor-nya sendiri

### DB Schema Utama
- `users` (+role, reseller_code, referrer_id, vendor_id)
- `vendors` (name, slug, logo, commission_rate override, status)
- `categories` (hierarchical, parent_id)
- `products` (vendor_id, price, price_reseller, stock, status)
- `product_images` (product_id, url, sort_order)
- `orders` (user_id, reseller_id, status, total, shipping info, payment_proof)
- `order_items` (order_id, product_id, vendor_id, quantity, price)
- `reseller_commissions` (reseller_id, order_id, rate, amount, status)
- `settings` (key-value: reseller_commission_rate, dll)

### API Structure
Base URL: `http://127.0.0.1:8001/api`
Auth: Laravel Sanctum (Bearer token)

Routes yang direncanakan:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /products`, `GET /products/{slug}`
- `GET /categories`
- `GET /vendors/{slug}`
- `POST /orders` (checkout)
- `GET /orders` (customer order history)
- `GET /reseller/commissions`
- `GET /admin/*` (admin panel)
- `GET /vendor/*` (vendor panel)

---

## Development Status

- ✅ Laravel 13 + Sanctum installed
- ✅ DB schema migrations (13 tables) — selesai
- ✅ Models (Vendor, Category, Product, ProductImage, Order, OrderItem, ResellerCommission, Setting)
- ✅ Frontend skeleton (React + Vite + Tailwind)
- 🔲 API routes & controllers (auth, products, orders)
- 🔲 Seeder (admin user, dummy vendors, dummy products)
- 🔲 Frontend pages (homepage, product list, product detail, checkout)
- 🔲 Admin panel
- 🔲 Vendor panel
