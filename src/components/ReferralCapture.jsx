import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useReferralStore } from '../stores/useReferralStore'

// Tangkap kode referral dari query string (?ref= atau ?referral_code=) di halaman mana pun.
// Disimpan ke session untuk auto-fill di checkout.
export default function ReferralCapture() {
  const { search } = useLocation()
  const saveReferral = useReferralStore((s) => s.set)

  useEffect(() => {
    const params = new URLSearchParams(search)
    const code = params.get('ref') || params.get('referral_code')
    if (code && code.trim()) {
      saveReferral(code)
    }
  }, [search, saveReferral])

  return null
}
