import { Type } from 'typebox'
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry'

/**
 * Plugin OpenClaw untuk SDP Marketplace — READ-ONLY.
 *
 * Semua tool di sini cuma GET. Jangan tambah tool yang ubah data:
 * token asisten di sisi Laravel sengaja cuma dikasih akses baca, jadi
 * request tulis bakal ditolak server dan cuma bikin bingung.
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:8001/api'

type Config = { baseUrl?: string; token?: string }

function readConfig(api: any): { baseUrl: string; token: string } {
  // Config plugin diutamakan; env var jadi cadangan biar tetap jalan
  // walau dijalankan di luar mekanisme config OpenClaw.
  const cfg: Config = (api?.config ?? {}) as Config
  const baseUrl = (cfg.baseUrl || process.env.SDP_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const token = cfg.token || process.env.SDP_ASSISTANT_TOKEN || ''
  return { baseUrl, token }
}

async function callSdp(api: any, path: string, query: Record<string, unknown> = {}) {
  const { baseUrl, token } = readConfig(api)

  if (!token) {
    throw new Error(
      'Token SDP belum diisi. Set config "token" pada plugin, atau env SDP_ASSISTANT_TOKEN ' +
        '(ambil dari ASSISTANT_API_TOKEN di sdp-api/.env).',
    )
  }

  const url = new URL(`${baseUrl}${path}`)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })

  if (res.status === 401) throw new Error('Token SDP ditolak (401). Cek ASSISTANT_API_TOKEN di sdp-api/.env.')
  if (res.status === 503) throw new Error('Assistant API SDP belum dikonfigurasi (ASSISTANT_API_TOKEN kosong di server).')
  if (!res.ok) throw new Error(`SDP API error ${res.status}: ${(await res.text()).slice(0, 300)}`)

  const json = (await res.json()) as { data?: unknown }
  return json.data
}

const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')

export default definePluginEntry({
  id: 'sdp-marketplace',
  name: 'SDP Marketplace',
  description: 'Read-only access ke data SDP Marketplace',

  register(api: any) {
    api.registerTool({
      name: 'sdp_summary',
      description:
        'Ringkasan SDP Marketplace: jumlah order & omzet hari ini dan bulan ini, order per status, ' +
        'order yang butuh aksi admin (menunggu ongkir / menunggu bayar), dan produk yang stoknya menipis. ' +
        'Pakai ini untuk pertanyaan umum seperti "gimana kondisi toko hari ini".',
      parameters: Type.Object({}),
      async execute(_id: string, _params: unknown) {
        const d: any = await callSdp(api, '/assistant/summary')

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

        return { content: [{ type: 'text', text: lines.join('\n') }], details: d }
      },
    })

    api.registerTool({
      name: 'sdp_orders',
      description:
        'Cari pesanan di SDP Marketplace berdasarkan nomor order atau nama pemesan, dan/atau saring per status. ' +
        'Pakai ini untuk pertanyaan seperti "status order INV-xxx apa" atau "pesanan atas nama Budi ada berapa".',
      parameters: Type.Object({
        search: Type.Optional(Type.String({ description: 'Nomor order atau nama pemesan' })),
        status: Type.Optional(
          Type.Union(
            [
              Type.Literal('pending_payment'),
              Type.Literal('awaiting_quote'),
              Type.Literal('processing'),
              Type.Literal('shipped'),
              Type.Literal('completed'),
              Type.Literal('cancelled'),
            ],
            { description: 'Saring per status order' },
          ),
        ),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
      }),
      async execute(_id: string, params: { search?: string; status?: string; limit?: number }) {
        const rows: any = await callSdp(api, '/assistant/orders', params)

        if (!rows?.length) {
          return { content: [{ type: 'text', text: 'Tidak ada pesanan yang cocok.' }], details: [] }
        }

        const text = rows
          .map((o: any) => {
            const tracking = o.tracking_number ? ` — resi ${o.tracking_number}` : ''
            return `${o.order_number} | ${o.status} | ${o.customer} | ${rupiah(o.total)}${tracking}`
          })
          .join('\n')

        return { content: [{ type: 'text', text }], details: rows }
      },
    })
  },
})
