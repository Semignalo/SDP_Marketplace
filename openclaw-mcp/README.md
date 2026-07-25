# MCP Server — SDP Marketplace (read-only)

Biar bisa tanya-tanya soal SDP lewat OpenClaw (WhatsApp/Telegram/dll) tanpa buka admin panel.

Transport **stdio**. Bungkus tipis di atas endpoint Laravel `/api/assistant/*`.

## Tool

| Tool | Fungsi |
|---|---|
| `sdp_summary` | Order & omzet hari ini/bulan ini, order per status, yang butuh aksi admin, stok menipis |
| `sdp_orders` | Cari pesanan by nomor order / nama pemesan, saring per status |

**Read-only.** Endpoint Laravel-nya cuma menerima GET — request tulis ditolak server (405).

## Setup

### 1. Backend SDP

Token sudah otomatis dibuat di `sdp-api/.env`:

```bash
grep ASSISTANT_API_TOKEN sdp-api/.env
```

Kalau `ASSISTANT_API_TOKEN` dikosongkan, endpoint mati total (503). Disengaja — **fail-closed**, biar tidak pernah ada kondisi "token kosong = bebas akses".

Backend harus jalan:

```bash
cd sdp-api && php artisan serve --port=8001
```

### 2. Pasang dependency

```bash
cd openclaw-mcp && npm install
```

### 3. Daftarkan ke OpenClaw

```bash
openclaw mcp add sdp \
  --command node \
  --arg C:/laragon/www/SDP/openclaw-mcp/server.js
```

Lalu set env var `SDP_ASSISTANT_TOKEN` untuk server ini (lewat `openclaw mcp configure sdp` atau langsung di `~/.openclaw/openclaw.json` pada entri `mcp.servers.sdp`).

Cek koneksinya:

```bash
openclaw mcp list
openclaw mcp probe sdp
openclaw mcp doctor --probe
```

## Konfigurasi

| Env var | Default | Keterangan |
|---|---|---|
| `SDP_ASSISTANT_TOKEN` | — | **Wajib.** Nilai `ASSISTANT_API_TOKEN` dari `sdp-api/.env` |
| `SDP_API_URL` | `http://127.0.0.1:8001/api` | Base URL API SDP |

## Uji mandiri

Tanpa perlu OpenClaw — menjalankan server ini sebagai subprocess dan memanggilnya lewat protokol MCP asli:

```bash
cd openclaw-mcp
SDP_ASSISTANT_TOKEN=$(grep ASSISTANT_API_TOKEN ../sdp-api/.env | cut -d= -f2) node smoke-test.mjs
```

## Status pengujian

| Bagian | Status |
|---|---|
| Endpoint Laravel terhadap DB asli | ✅ Diuji |
| Auth: tanpa token / salah / beda 1 karakter → 401 | ✅ Diuji |
| Fail-closed saat `ASSISTANT_API_TOKEN` kosong → 503 | ✅ Diuji |
| POST ke endpoint → 405 | ✅ Diuji |
| Handshake MCP + `tools/list` + `tools/call` (protokol asli) | ✅ Diuji |
| Validasi input (`limit` di luar batas) ditolak | ✅ Diuji |
| Error jelas saat token salah / backend mati | ✅ Diuji |
| **Dipasang di OpenClaw sungguhan (`openclaw mcp add`)** | ❌ **Belum** — OpenClaw tidak terpasang di mesin dev |

Baris terakhir: protokol MCP-nya sendiri sudah terbukti benar lewat MCP client resmi, jadi risiko sisa cuma di sisi perintah pendaftaran OpenClaw-nya.

## Keamanan

- Token statis, bukan Sanctum — dipanggil agent lokal, bukan sesi browser
- Perbandingan token pakai `hash_equals` (waktu-tetap)
- Rate limit 60 request/menit
- PII dibatasi: cuma nama pemesan; email/telepon/alamat **tidak** diekspos
- Jangan expose port 8001 ke internet publik untuk keperluan ini

## Alternatif

Ada juga [`../openclaw-plugin/`](../openclaw-plugin/) — plugin OpenClaw native dengan fungsi identik, dibuat sebelum saya menyadari OpenClaw mendukung MCP. **MCP (folder ini) adalah jalur yang direkomendasikan**; folder plugin aman dihapus kalau tidak dipakai.
