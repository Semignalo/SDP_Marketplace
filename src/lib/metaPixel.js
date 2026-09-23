// Meta Pixel (browser). Tiga status:
//  - pending: belum tahu boleh/tidak (pengaturan atau region masih dimuat) → event ditampung
//  - on:      Pixel aktif
//  - off:     tidak ada Pixel ID, atau pengunjung dari India → event dibuang
// Purchase server-side dikirim terpisah lewat Conversions API; kedua sisi memakai
// event_id yang sama ("purchase-{order_number}") supaya Meta men-dedupe.

let status = 'pending'
let queue = []
const MAX_QUEUE = 20

function loadScript() {
  if (window.fbq) return
  const fbq = function (...args) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
  }
  window.fbq = fbq
  window._fbq = fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

function send(name, params, eventId) {
  const options = eventId ? { eventID: eventId } : undefined
  window.fbq('track', name, params || {}, options)
}

export function enableMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return
  const wasOff = status === 'off'
  loadScript()
  if (!window.__sdpPixelInit) {
    window.fbq('init', pixelId)
    window.__sdpPixelInit = pixelId
  }
  if (wasOff) window.fbq('consent', 'grant')
  status = 'on'
  queue.forEach((e) => send(e.name, e.params, e.eventId))
  queue = []
}

export function disableMetaPixel() {
  // Sudah termuat lalu pengunjung pindah ke region India → hentikan pengiriman.
  if (typeof window !== 'undefined' && window.fbq && status === 'on') {
    window.fbq('consent', 'revoke')
  }
  status = 'off'
  queue = []
}

export function trackPageView() {
  if (status === 'on') window.fbq('track', 'PageView')
}

export function trackEvent(name, params, eventId) {
  if (status === 'on') {
    send(name, params, eventId)
  } else if (status === 'pending' && queue.length < MAX_QUEUE) {
    queue.push({ name, params, eventId })
  }
}
