import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useReferralStore } from '../stores/useReferralStore'

// /r/:code — simpan kode referral ke session lalu arahkan ke beranda.
// Kode akan otomatis terisi di halaman checkout.
export default function ReferralRedirectPage() {
  const { code } = useParams()
  const saveReferral = useReferralStore((s) => s.set)

  useEffect(() => {
    if (code) {
      saveReferral(code)
      toast.success('Kode referral tersimpan & akan dipakai saat checkout')
    }
  }, [code, saveReferral])

  return <Navigate to="/products" replace />
}
