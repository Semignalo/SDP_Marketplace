let loadPromise = null

/**
 * Dynamically load Midtrans Snap.js (idempotent).
 * Returns a promise that resolves with the global `window.snap` object.
 */
export function loadSnap({ clientKey, isProduction = false }) {
  if (!clientKey) {
    return Promise.reject(new Error('Midtrans client_key kosong'))
  }

  if (typeof window !== 'undefined' && window.snap) {
    return Promise.resolve(window.snap)
  }

  if (loadPromise) return loadPromise

  const url = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => {
      if (window.snap) resolve(window.snap)
      else reject(new Error('Snap.js loaded tapi window.snap tidak tersedia'))
    }
    script.onerror = () => reject(new Error('Gagal load Snap.js dari Midtrans'))
    document.head.appendChild(script)
  })

  return loadPromise
}
