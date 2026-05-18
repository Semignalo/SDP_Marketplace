# TUTORIAL — SDP Marketplace

Panduan teknis untuk developer / owner SDP Marketplace.

> **Stack:** React + Vite (port 5174) · Laravel 13 (port 8001) · MySQL `sdp_db`
> **VPS:** IDCloudHost `157.10.161.83` · User: `STARINC`

---

## Daftar Isi

1. [Akses VPS](#1-akses-vps)
2. [Jalankan Project Lokal](#2-jalankan-project-lokal)
3. [Ubah Tampilan Homepage](#3-ubah-tampilan-homepage)
4. [Ubah Pengaturan Toko (Admin Panel)](#4-ubah-pengaturan-toko-admin-panel)
5. [Push ke GitHub](#5-push-ke-github)
6. [Pull & Deploy di VPS](#6-pull--deploy-di-vps)
7. [Tambah Produk / Vendor](#7-tambah-produk--vendor)
8. [Reset Database (Dev Only)](#8-reset-database-dev-only)

---

## 1. Akses VPS

### Via SSH (terminal)

```powershell
ssh STARINC@157.10.161.83
# Masukkan password saat diminta
```

### Via FileZilla (SFTP — upload file manual)

| Field | Value |
|---|---|
| Host | `157.10.161.83` |
| Username | `STARINC` |
| Password | password VPS |
| Port | `22` |
| Protocol | SFTP |

### Lokasi file di VPS

| Folder | Isi |
|---|---|
| `/var/www/SDP/` | Frontend (React build) |
| `/var/www/SDP/sdp-api/` | Backend Laravel |
| `/var/www/SDP/sdp-api/.env` | Konfigurasi production (DB, Cloudinary, dll) |

---

## 2. Jalankan Project Lokal

Pastikan **Laragon** sudah jalan (MySQL aktif).

### Backend (Laravel)

```powershell
cd c:\laragon\www\SDP\sdp-api
php artisan serve --port=8001
```

### Frontend (React)

```powershell
cd c:\laragon\www\SDP
npm run dev
# Buka: http://127.0.0.1:5174
```

### Kalau database kosong / error

```powershell
cd c:\laragon\www\SDP\sdp-api
php artisan migrate:fresh --seed
# ⚠️ Hanya untuk lokal — hapus semua data!
```

---

## 3. Ubah Tampilan Homepage

File: `src/pages/HomePage.jsx`

Buka file → `Ctrl+F` → cari teks yang mau diubah → edit → Save.

### Yang bisa diubah

**Teks hero besar:**
```jsx
// Cari:
Brand pilihan,{' '}
<em ...>dalam satu tempat.</em>

// Ganti teks sesuai keinginan
```

**Subteks hero:**
```jsx
// Cari:
Marketplace multi-brand untuk fashion, beauty, dan
kebuduhan harian dari kurator terpercaya.
```

**Label tombol:**
```jsx
BELANJA SEKARANG    // tombol hitam
JELAJAHI BRAND      // tombol outline
```

**Foto hero:**
```jsx
// Cari: src="https://images.unsplash.com/..."
// Ganti dengan URL foto lain
// Sumber foto gratis: unsplash.com
```

**Label section:**
```jsx
KOLEKSI PILIHAN    // label di atas judul hero
BRAND PILIHAN      // di atas strip logo brand
BARU DATANG        // di atas grid produk
```

### Setelah edit

```powershell
# Kalau Vite sedang jalan → browser auto-refresh, tidak perlu apa-apa

# Kalau mau build untuk production:
npm run build
```

---

## 4. Ubah Pengaturan Toko (Admin Panel)

Login sebagai admin → buka `/admin/settings`

### Yang bisa diubah via admin panel

| Group | Setting |
|---|---|
| **Brand** | Nama situs, tagline |
| **Tampilan** | Teks announcement bar atas (2 baris) |
| **Pengiriman** | Minimum gratis ongkir, ongkir flat default |
| **Komisi** | Rate komisi referral (%) |
| **Kontak** | Nomor WhatsApp CS |
| **Pembayaran** | Nama bank, nomor rekening, nama pemilik rekening |
| **Tier Loyalty** | Nama, minimum spending, dan % diskon untuk 5 tier |

### Ubah info rekening bank

1. Login admin → `/admin/settings`
2. Scroll ke group **Pembayaran**
3. Isi: Nama Bank, Nomor Rekening, Nama Pemilik
4. Klik **Simpan Semua**

Langsung berlaku di halaman detail pesanan customer.

---

## 5. Push ke GitHub

Lakukan ini setiap kali selesai membuat perubahan.

### Langkah-langkah

```powershell
cd c:\laragon\www\SDP

# 1. Cek file apa saja yang berubah
git status

# 2. Tambahkan semua perubahan
git add -A

# 3. Buat commit dengan pesan yang jelas
git commit -m "feat: deskripsi singkat perubahan"

# 4. Push ke GitHub
git push origin main
```

### Contoh pesan commit yang baik

```
feat: tambah halaman kontak
fix: perbaiki bug checkout tidak bisa submit
chore: update teks hero homepage
style: ubah warna tombol utama
```

### Kalau push ditolak (rejected)

```powershell
# Pull dulu perubahan dari remote
git pull origin main

# Selesaikan conflict jika ada, lalu push ulang
git push origin main
```

---

## 6. Pull & Deploy di VPS

Jalankan ini di VPS setelah ada perubahan di GitHub.

### Masuk ke VPS

```bash
ssh STARINC@157.10.161.83
cd /var/www/SDP
```

### Deploy frontend + backend

```bash
# 1. Pull perubahan terbaru
git pull origin main

# 2. Install dependency backend (kalau ada perubahan composer.json)
cd sdp-api
composer install --no-dev --optimize-autoloader

# 3. Jalankan migration (JANGAN fresh --seed di production!)
php artisan migrate

# 4. Kalau ada perubahan settings baru di SettingsSeeder
php artisan db:seed --class=SettingsSeeder

# 5. Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# 6. Build frontend
cd /var/www/SDP
npm ci
npm run build

# 7. Restart queue worker (kalau pakai queue)
sudo supervisorctl restart sdp-worker
```

### Checklist setelah deploy

- [ ] Buka website → tidak ada error
- [ ] Login admin → panel bisa diakses
- [ ] Coba tambah ke keranjang → checkout jalan
- [ ] Cek `/admin/settings` → rekening bank benar

---

## 7. Tambah Produk / Vendor

### Tambah Vendor baru

1. Login admin → `/admin` → **Vendors**
2. Klik **Tambah Vendor**
3. Isi nama, email (akan jadi email login vendor), password, status
4. Klik **Simpan** → akun vendor_admin otomatis dibuat

Vendor bisa login di `/login` dengan email & password yang diisi admin.

### Tambah Produk (sebagai Admin)

1. Login admin → `/admin` → **Produk**
2. Klik **Tambah Produk**
3. Pilih vendor, isi nama, kategori, harga, stok, upload gambar
4. Klik **Tambah Produk**

### Tambah Produk (sebagai Vendor)

1. Login sebagai vendor → `/vendor` → **Produk**
2. Klik **Tambah Produk**
3. Isi form → upload gambar (klik area upload atau paste URL)
4. Klik **Simpan**

### Upload Gambar Produk

- Klik tab **Upload File** → pilih gambar dari komputer
- Atau klik tab **Paste URL** → tempel link gambar
- Maksimal **8 gambar** per produk
- Format: JPG, PNG, WebP · Maks 5 MB per file
- Drag gambar untuk **urutkan** · Klik ★ untuk **jadikan gambar utama**

---

## 8. Reset Database (Dev Only)

> ⚠️ **HANYA untuk lokal.** Perintah ini menghapus semua data.

```powershell
cd c:\laragon\www\SDP\sdp-api

# Hapus semua tabel, buat ulang, isi data dummy
php artisan migrate:fresh --seed
```

### Data dummy yang akan dibuat

| Tipe | Jumlah |
|---|---|
| Admin | 1 (`admin@sdp.local` / `password`) |
| Vendor + akun vendor_admin | 5 + STARINC |
| Customer | 10 (`customer1@sdp.local` s/d `customer10@sdp.local`) |
| Produk | 35+ |
| Settings | Semua default (bank, tier, shipping, dll) |

---

## Catatan Penting

- Jangan jalankan `migrate:fresh --seed` di VPS — data production akan hilang
- File `.env` tidak ikut di Git — harus dibuat manual di VPS
- Cloudinary dipakai untuk upload gambar — konfigurasi ada di `.env` (`CLOUDINARY_*`)
- Kalau ada perubahan settings baru, jalankan `php artisan db:seed --class=SettingsSeeder` (aman, pakai `updateOrCreate`)
