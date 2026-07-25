# Plugin OpenClaw — SDP Marketplace (read-only)

Biar bisa tanya-tanya soal SDP lewat OpenClaw (WhatsApp/Telegram/dll) tanpa buka admin panel.

## Tool yang tersedia

| Tool | Fungsi |
|---|---|
| `sdp_summary` | Order & omzet hari ini/bulan ini, order per status, yang butuh aksi admin, stok menipis |
| `sdp_orders` | Cari pesanan by nomor order / nama pemesan, saring per status |

**Read-only.** Endpoint di sisi Laravel cuma menerima GET — request tulis ditolak server (405).

## Setup

### 1. Sisi SDP (Laravel)

Token sudah otomatis dibuat di `sdp-api/.env` saat plugin ini dibikin:

```env
ASSISTANT_API_TOKEN=<token 64 karakter>
ASSISTANT_LOW_STOCK_THRESHOLD=5
```

Ambil nilainya:

```bash
grep ASSISTANT_API_TOKEN sdp-api/.env
```

Kalau `ASSISTANT_API_TOKEN` dikosongkan, endpoint mati total (balas 503). Ini disengaja — **fail-closed**, biar gak pernah ada kondisi "token kosong = bebas akses".

Pastikan API jalan:

```bash
cd sdp-api && php artisan serve --port=8001
```

### 2. Sisi OpenClaw

```bash
openclaw plugins install --link ./openclaw-plugin
```

Lalu isi config plugin (`plugins.entries.sdp-marketplace.config`):

```json
{
  "baseUrl": "http://127.0.0.1:8001/api",
  "token": "<isi ASSISTANT_API_TOKEN>"
}
```

Alternatif lewat env var kalau lebih praktis: `SDP_API_URL` dan `SDP_ASSISTANT_TOKEN`.

Cek plugin kebaca:

```bash
openclaw plugins inspect sdp-marketplace --runtime --json
```

## Status pengujian

| Bagian | Status |
|---|---|
| Endpoint Laravel (`/api/assistant/summary`, `/api/assistant/orders`) | ✅ Diuji terhadap DB asli |
| Auth: tanpa token / token salah / token beda 1 karakter → 401 | ✅ Diuji |
| Fail-closed saat `ASSISTANT_API_TOKEN` kosong → 503 | ✅ Diuji |
| POST ke endpoint → 405 | ✅ Diuji |
| Logika HTTP + formatting plugin | ✅ Diuji lewat Node terhadap server hidup |
| **Plugin di runtime OpenClaw asli** | ❌ **Belum** — OpenClaw tidak terpasang di mesin dev |

Baris terakhir penting: struktur plugin (`openclaw.plugin.json`, `definePluginEntry`, `api.registerTool`) disusun mengikuti dokumentasi resmi OpenClaw, tapi **belum pernah benar-benar dimuat OpenClaw**. Kalau `plugins install` protes soal bentuk manifest atau signature `execute`, itu wajar — cocokkan dengan versi OpenClaw yang terpasang.

## ⚠️ Ada jalur yang lebih direkomendasikan: MCP

**OpenClaw mendukung MCP native** ([`docs.openclaw.ai/cli/mcp`](https://docs.openclaw.ai/cli/mcp)) — `openclaw mcp add`, config di `~/.openclaw/openclaw.json`.

Plugin ini dibuat saat saya **keliru menyimpulkan** MCP tidak didukung. Kesimpulan itu salah: halaman `/cli/mcp` luput dari pencarian saya.

**Pakai [`../openclaw-mcp/`](../openclaw-mcp/) sebagai jalur utama** — standar, terdokumentasi resmi, sekali perintah pasang.

Plugin ini tetap berfungsi dan boleh dipakai kalau lebih suka tanpa proses MCP server terpisah. Kalau cuma mau pakai MCP, **folder ini aman dihapus** — endpoint Laravel-nya dipakai bersama, jadi tidak ada yang rusak.

## Keamanan

- Token statis, bukan Sanctum — dipanggil agent lokal, bukan sesi browser
- Perbandingan token pakai `hash_equals` (waktu-tetap)
- Rate limit 60 request/menit
- PII dibatasi: cuma nama pemesan; email/telepon/alamat **tidak** diekspos
- Jangan expose port 8001 ke internet publik untuk keperluan ini
