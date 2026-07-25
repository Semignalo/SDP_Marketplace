#!/usr/bin/env node
/**
 * Smoke test MCP server SDP — jalankan server ini sebagai subprocess stdio
 * lalu panggil lewat protokol MCP asli (bukan panggil fungsinya langsung).
 *
 * Pakai:
 *   cd sdp-api && php artisan serve --port=8001     # backend harus jalan
 *   SDP_ASSISTANT_TOKEN=<token> node smoke-test.mjs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const token = process.env.SDP_ASSISTANT_TOKEN || ''

if (!token) {
  console.error('SDP_ASSISTANT_TOKEN belum diset. Ambil dari sdp-api/.env')
  process.exit(1)
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(here, 'server.js')],
  env: { ...process.env, SDP_ASSISTANT_TOKEN: token },
})

const client = new Client({ name: 'smoke-test', version: '1.0.0' })
await client.connect(transport)
console.log('✅ handshake MCP berhasil')

const { tools } = await client.listTools()
console.log(`✅ tools/list: ${tools.map((t) => t.name).join(', ')}`)
for (const t of tools) {
  console.log(`   - ${t.name}: ${(t.description || '').slice(0, 70)}...`)
}

console.log('\n=== tools/call sdp_summary ===')
const summary = await client.callTool({ name: 'sdp_summary', arguments: {} })
console.log(summary.content[0].text)

console.log('\n=== tools/call sdp_orders (search=Dummy, limit=3) ===')
const orders = await client.callTool({ name: 'sdp_orders', arguments: { search: 'Dummy', limit: 3 } })
console.log(orders.content[0].text)

console.log('\n=== tools/call sdp_orders (status=completed, limit=2) ===')
const done = await client.callTool({ name: 'sdp_orders', arguments: { status: 'completed', limit: 2 } })
console.log(done.content[0].text)

console.log('\n=== error handling: limit di luar batas (harus ditolak) ===')
try {
  const bad = await client.callTool({ name: 'sdp_orders', arguments: { limit: 999 } })
  console.log(bad.isError ? `✅ ditolak: ${bad.content[0].text.slice(0, 120)}` : '❌ lolos padahal di luar batas')
} catch (e) {
  console.log(`✅ ditolak: ${String(e.message).slice(0, 120)}`)
}

await client.close()
console.log('\n✅ selesai')
