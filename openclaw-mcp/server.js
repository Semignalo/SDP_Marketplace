#!/usr/bin/env node
/**
 * MCP server READ-ONLY untuk SDP Marketplace.
 *
 * Bungkus tipis di atas endpoint Laravel /api/assistant/*.
 * Transport: stdio — dipanggil OpenClaw lewat `openclaw mcp add`.
 *
 * ATURAN: cuma GET. Jangan tambah tool yang ubah data — token di sisi Laravel
 * memang cuma dikasih akses baca, jadi request tulis bakal ditolak server.
 *
 * Konfigurasi lewat env var:
 *   SDP_API_URL          default http://127.0.0.1:8001/api
 *   SDP_ASSISTANT_TOKEN  wajib — nilai ASSISTANT_API_TOKEN dari sdp-api/.env
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = (process.env.SDP_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '')
const TOKEN = process.env.SDP_ASSISTANT_TOKEN || ''

const rupiah = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID')

async function callSdp(path, query = {}) {
  if (!TOKEN) {
    throw new Error(
      'SDP_ASSISTANT_TOKEN belum diset. Ambil nilai ASSISTANT_API_TOKEN dari sdp-api/.env, ' +
        'lalu set sebagai env var di konfigurasi MCP server ini.',
    )
  }

  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
  } catch (e) {
    throw new Error(
      `Tidak bisa menghubungi SDP API di ${BASE_URL}. Pastikan backend jalan ` +
        `(cd sdp-api && php artisan serve --port=8001). Detail: ${e.message}`,
    )
  }

  if (res.status === 401) throw new Error('Token SDP ditolak (401). Cek ASSISTANT_API_TOKEN di sdp-api/.env.')
  if (res.status === 503) throw new Error('Assistant API SDP belum dikonfigurasi (ASSISTANT_API_TOKEN kosong di server).')
  if (res.status === 429) throw new Error('Kena rate limit SDP API (maks 60 request/menit). Coba lagi sebentar.')
  if (!res.ok) throw new Error(`SDP API error ${res.status}: ${(await res.text()).slice(0, 300)}`)

  return (await res.json()).data
}

/** Bungkus handler biar error tampil rapi sebagai hasil tool, bukan crash transport. */
const safe = (fn) => async (args) => {
  try {
    return await fn(args)
  } catch (e) {
    return { content: [{ type: 'text', text: `Gagal: ${e.message}` }], isError: true }
  }
}

const server = new McpServer({ name: 'sdp-marketplace', version: '1.0.0' })

server.registerTool(
  'sdp_summary',
  {
    title: 'Ringkasan SDP Marketplace',
    description:
      'Ringkasan kondisi toko SDP: jumlah order & omzet hari ini dan bulan ini, order per status, ' +
      'order yang butuh aksi admin (menunggu ongkir / menunggu bayar / perlu dikirim), dan produk yang stoknya menipis. ' +
      'Pakai untuk pertanyaan umum seperti "gimana kondisi toko hari ini".',
    inputSchema: {},
  },
  safe(async () => {
    const d = await callSdp('/assistant/summary')

    const lines = [
      `Hari ini: ${d.today.orders} order, omzet ${rupiah(d.today.revenue)}`,
      `Bulan ini: ${d.this_month.orders} order, omzet ${rupiah(d.this_month.revenue)}`,
      '',
      'Order per status:',
      ...Object.entries(d.orders_by_status ?? {}).map(([s, c]) => `  - ${s}: ${c}`),
      '',
      `Butuh aksi: ${d.needs_action.awaiting_quote} menunggu ongkir, ` +
        `${d.needs_action.pending_payment} menunggu bayar, ${d.needs_action.processing} perlu dikirim`,
    ]

    if (d.awaiting_quote_orders?.length) {
      lines.push('', 'Order menunggu ongkir:')
      for (const o of d.awaiting_quote_orders) {
        lines.push(`  - ${o.order_number} (${o.customer}, ${o.country}) — nunggu ${o.waiting_hours} jam`)
      }
    }

    if (d.low_stock?.length) {
      lines.push('', `Stok menipis (<= ${d.low_stock_threshold}):`)
      for (const p of d.low_stock) lines.push(`  - ${p.name}: sisa ${p.stock}`)
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] }
  }),
)

server.registerTool(
  'sdp_orders',
  {
    title: 'Cari pesanan SDP',
    description:
      'Cari pesanan di SDP berdasarkan nomor order atau nama pemesan, dan/atau saring per status. ' +
      'Pakai untuk pertanyaan seperti "status order INV-xxx apa" atau "pesanan atas nama Budi ada berapa".',
    inputSchema: {
      search: z.string().max(50).optional().describe('Nomor order atau nama pemesan'),
      status: z
        .enum(['pending_payment', 'awaiting_quote', 'processing', 'shipped', 'completed', 'cancelled'])
        .optional()
        .describe('Saring per status order'),
      limit: z.number().int().min(1).max(50).optional().describe('Jumlah maksimum hasil (default 10)'),
    },
  },
  safe(async ({ search, status, limit }) => {
    const rows = await callSdp('/assistant/orders', { search, status, limit })

    if (!rows?.length) {
      return { content: [{ type: 'text', text: 'Tidak ada pesanan yang cocok.' }] }
    }

    const text = rows
      .map((o) => {
        const tracking = o.tracking_number ? ` — resi ${o.tracking_number}` : ''
        return `${o.order_number} | ${o.status} | ${o.customer} | ${rupiah(o.total)}${tracking}`
      })
      .join('\n')

    return { content: [{ type: 'text', text }] }
  }),
)

await server.connect(new StdioServerTransport())
