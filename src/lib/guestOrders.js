// Simpan guest_token per order di localStorage agar bisa lacak ulang
// tanpa link email (dalam browser yang sama).
const KEY = 'sdp-guest-orders'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveGuestToken(orderNumber, token) {
  if (!orderNumber || !token) return
  const all = readAll()
  all[orderNumber] = token
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getGuestToken(orderNumber) {
  if (!orderNumber) return null
  return readAll()[orderNumber] || null
}
