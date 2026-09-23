// Atribusi iklan (last-touch, jendela 7 hari — disamakan dengan window klik Meta).
// Ditangkap sinkron saat boot (main.jsx), sebelum router jalan: link seperti /r/KODE?utm_…
// di-redirect oleh router dan query string-nya hilang.
// Beda dengan referral reseller (useReferralStore, 30 hari) — sengaja terpisah.

const STORAGE_KEY = 'sdp-attribution'
export const ATTRIBUTION_TTL_DAYS = 7
const TTL_MS = ATTRIBUTION_TTL_DAYS * 24 * 60 * 60 * 1000

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.captured_at || Date.now() - data.captured_at > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function cookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Panggil sekali saat boot. Last-touch: hanya menimpa kalau URL ini membawa utm_* atau fbclid.
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const touch = {}
    for (const key of [...UTM_KEYS, 'fbclid']) {
      const value = params.get(key)?.trim()
      if (value) touch[key] = value.slice(0, 255)
    }
    if (Object.keys(touch).length === 0) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...touch,
      landing_url: `${window.location.origin}${window.location.pathname}${window.location.search}`.slice(0, 500),
      captured_at: Date.now(),
    }))
  } catch { /* localStorage tidak tersedia (mode privat ketat) — atribusi dilewati */ }
}

// Payload untuk checkout. fbp (cookie Pixel) dikirim walau tidak ada atribusi iklan,
// karena berguna untuk pencocokan Purchase di Conversions API.
export function getAttributionPayload() {
  const stored = read()
  const fbp = cookie('_fbp')
  const fbc = cookie('_fbc') || (stored?.fbclid ? `fb.1.${stored.captured_at}.${stored.fbclid}` : null)

  const payload = { ...(stored || {}), ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) }
  return Object.keys(payload).length ? payload : undefined
}
