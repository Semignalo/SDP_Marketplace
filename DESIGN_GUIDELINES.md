# SDP Design & Asset Guidelines

Dokumen acuan untuk semua orang yang membuat asset visual untuk SDP — vendor admin yang upload foto produk, tim yang bikin banner promo, atau siapa pun yang export dari Canva/Figma. Ikuti angka di sini supaya semua asset tampil rapi tanpa harus crop ulang di kode.

Brand voice (copy) sudah diatur terpisah — lihat aturan tone of voice (full English, pendek, confident). Dokumen ini khusus **visual**.

---

## 1. Brand Foundation

### 1.1 Visual Direction
Monochrome premium minimalis. Warna datang dari **foto produk**, bukan dari elemen UI. UI tetap netral (hitam/putih/abu) + 1 accent warna terracotta untuk CTA/diskon.

### 1.2 Palet Warna (`tailwind.config.js`)

| Token | Hex | Pakai untuk |
|---|---|---|
| `ink` | `#1a1a1a` | Teks utama, tombol primary, overlay gelap |
| `ink-soft` | `#333333` | Teks sekunder |
| `ink-muted` | `#6b6b6b` | Caption, label, teks tersier |
| `ink-faint` | `#a3a3a3` | Placeholder, icon non-aktif |
| `paper` | `#ffffff` | Background utama |
| `paper-soft` | `#fafafa` | Background section alternatif |
| `paper-warm` | `#f5f5f5` | Background placeholder gambar (sebelum load) |
| `line` | `#e5e5e5` | Border standar |
| `line-strong` | `#d4d4d4` | Border lebih tegas (hover, focus) |
| `accent` | `#b5562f` | CTA aksen, badge diskon, harga promo |
| `accent-hover` | `#96431f` | Hover state accent |
| `rating` | `#f5b400` | Bintang rating |
| `state-success` | `#15803d` | Status lunas/sukses |
| `state-warning` | `#a16207` | Status pending |
| `state-danger` | `#b91c1c` | Error, badge sale |

**Aturan:** Jangan tambah warna baru di luar tabel ini untuk elemen UI (tombol, badge, background section). Foto produk/banner boleh penuh warna — itu yang justru jadi sumber warna di halaman.

### 1.3 Tipografi
- Font: **Inter** (fallback system-ui).
- Semua teks asset (banner, label promo) pakai Inter — jangan campur font lain.
- Eyebrow/label kecil: uppercase, letter-spacing lebar (`tracking-eyebrow` = 0.25em). Contoh: "CURATED COLLECTION", "ON SALE".
- Heading besar boleh kombinasi bold + italic-light untuk baris kedua (lihat hero homepage: *"finally, in one place."*).

### 1.4 Radius & Shadow
- Radius default: **4px**. Maksimal **8px** (`rounded-lg`) untuk card/banner besar.
- Foto produk & vendor logo: radius kecil (4–6px), kecuali logo vendor yang dibuat bulat penuh (`pill`/circle).
- Shadow minim: dua level saja — `card` (halus) dan `hover` (sedikit lebih tegas). Hindari drop shadow besar/berwarna.

---

## 2. Foto Produk (SKU Images)

Ini yang paling sering disalahkan vendor admin — ikuti persis supaya grid produk tidak pecah.

### 2.1 Spesifikasi Teknis
| Aspek | Ketentuan |
|---|---|
| Format file | JPG, PNG, atau WebP |
| Ukuran file maksimal | 5 MB / foto |
| Jumlah foto per SKU | 1–8 foto |
| Resolusi sumber (disarankan) | Minimal **1200 × 1600 px** (rasio 3:4) |
| Resolusi minimum (hard limit) | 800 × 1067 px |
| Mode warna | RGB (bukan CMYK) |
| Background | Putih bersih (`#ffffff`) atau netral terang untuk foto produk utama; foto lifestyle/konteks bebas tapi tetap terang |

### 2.2 Rasio & Crop
| Slot tampil di UI | Rasio | Catatan |
|---|---|---|
| **Foto utama produk** (card, grid katalog) | **3:4** (potret) | Wajib — ini rasio yang dipakai di semua grid produk. Subjek produk di tengah, beri margin ±10% di semua sisi. |
| **Thumbnail keranjang/checkout** | 1:1 (square) | Crop otomatis dari foto pertama — pastikan subjek tetap utuh kalau dipotong jadi kotak. |
| **Galeri detail produk** | 3:4 (sama dengan utama) | Semua foto dalam 1 SKU sebaiknya pakai rasio yang sama agar swipe galeri konsisten. |

### 2.3 Urutan Foto (Wajib)
1. **Foto 1 (utama/"Utama")** — produk saja, background bersih, jadi thumbnail di semua listing.
2. **Foto 2–4** — angle lain / detail (tekstur, kemasan, label).
3. **Foto 5–8** — lifestyle / penggunaan produk, model, konteks.

### 2.4 Penamaan File (sebelum upload, untuk arsip vendor)
```
{sku}_{urutan}.jpg
contoh: KNY-SRM-001_01.jpg, KNY-SRM-001_02.jpg
```
SKU mengikuti format yang sudah ada di tabel `products.sku` — pakai SKU yang sama persis dengan yang didaftarkan di sistem, supaya gampang dicocokkan kalau ada audit asset.

---

## 3. Vendor Logo

| Aspek | Ketentuan |
|---|---|
| Rasio sumber | 1:1 (square) |
| Resolusi minimum | 400 × 400 px |
| Resolusi disarankan | 800 × 800 px |
| Format | PNG (transparan jika logo punya background warna) atau JPG |
| Tampil sebagai | Lingkaran (`rounded-pill`) di brand strip & header vendor — pastikan logo aman dipotong jadi bulat (logo full-bleed/kotak tanpa padding akan terpotong di ujung) |
| Safe area | Beri padding ±10% di semua sisi dalam kanvas square supaya tidak terpotong saat di-crop bulat |

---

## 4. Banner & Hero Images

Banner dipakai di beberapa slot dengan rasio berbeda — **jangan pakai 1 file untuk semua slot**, export per rasio.

| Slot | Rasio | Ukuran export disarankan | Dipakai di |
|---|---|---|---|
| **Hero banner** (homepage, full-width) | ~21:9 hingga 16:9 (landscape lebar) | **1920 × 960 px** (desktop), crop tengah aman untuk mobile | Hero section homepage |
| **Promo banner besar** (sale, kotak besar di grid promo) | 16:10 | **1280 × 800 px** | Section "On Sale" — gambar besar kiri |
| **Promo banner kecil** (kotak kecil di grid promo) | 1:1 | **800 × 800 px** | Section "On Sale" — 4 kotak kecil kanan |
| **Editorial / storytelling block** | 4:5 (mobile) / 3:4 (desktop) — export 3:4, biarkan crop otomatis | **1200 × 1600 px** | Section editorial ("handpicked, not just listed") |
| **Kartu kategori/koleksi** (3-card section) | 4:5 | **1000 × 1250 px** | Section 3 kartu CTA homepage |
| **Galeri komunitas/UGC** | 4:5 | **800 × 1000 px** | Section "Style, your way" |

### Aturan Teks di Atas Banner
- Semua banner dengan teks overlay otomatis diberi **gradient gelap** dari kode (atas atau bawah, `ink` di ~50-80% opacity). Jadi: **jangan** taruh teks penting di tengah foto banner — area teks akan ditimpa gradient + teks HTML asli, bukan teks yang dibakar ke gambar.
- Kalau ingin highlight tertentu via teks, biarkan area itu kosong/polos (langit, dinding, area negative space) di posisi atas/bawah sesuai slot.
- Subjek/wajah/produk penting jangan ditaruh di pinggir paling bawah (overlay gradient paling gelap di sana) atau paling atas mobile (tertutup navbar).

### Format Export
- Format: **JPG** (q80) untuk foto, **WebP** kalau platform support, **PNG** hanya untuk asset dengan transparansi.
- Maksimal file size: **300 KB** per banner (compress sebelum upload — banner besar yang berat akan memperlambat homepage).

---

## 5. Video (untuk pengembangan ke depan)

Belum ada slot video aktif di product/homepage saat ini, tapi kalau ditambahkan (video produk, video hero), ikuti standar ini supaya konsisten dengan rasio foto yang sudah ada:

| Slot | Rasio | Resolusi | Durasi disarankan | Format |
|---|---|---|---|---|
| Video hero (background, autoplay muted) | 16:9 landscape | 1920×1080 (1080p), 24–30fps | 6–15 detik, loop seamless | MP4 (H.264), max ~8 MB, tanpa audio wajib |
| Video produk (galeri detail produk, slot tambahan setelah foto) | 3:4 potret — samakan dengan foto produk | 1080×1440 | 15–60 detik | MP4 (H.264), thumbnail/poster wajib disiapkan (still frame, rasio sama) |
| Video story/UGC (community section) | 4:5 atau 9:16 | 1080×1350 / 1080×1920 | 10–30 detik | MP4, max 15 MB |

Catatan teknis: semua video butuh **poster image** (thumbnail still) dengan rasio identik, karena video tidak boleh nge-block render awal halaman — poster tampil dulu sebelum video load.

---

## 6. Quick Reference — Ukuran Export

```
Hero banner          1920 × 960    (≈21:9–16:9)
Promo banner besar   1280 × 800    (16:10)
Promo banner kecil    800 × 800    (1:1)
Editorial block      1200 × 1600   (3:4)
Kartu koleksi        1000 × 1250   (4:5)
Galeri komunitas      800 × 1000   (4:5)
Foto produk utama    1200 × 1600   (3:4)
Vendor logo            800 × 800   (1:1, safe area 10%)
Video hero           1920 × 1080  (16:9)
Video produk          1080 × 1440  (3:4)
```

## 7. Checklist Sebelum Upload

- [ ] Rasio sesuai tabel slot tujuan (bukan ditarik paksa dari foto lain)
- [ ] File size di bawah limit (5 MB foto produk, 300 KB banner, 8 MB video hero)
- [ ] Background bersih untuk foto produk utama (foto pertama per SKU)
- [ ] Nama file pakai SKU yang valid di sistem
- [ ] Tidak ada teks penting yang akan tertutup gradient overlay di banner
- [ ] Warna UI yang dipakai (kalau ada elemen desain, bukan foto) sesuai palet di §1.2
