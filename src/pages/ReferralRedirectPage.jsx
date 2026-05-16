import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useReferralStore } from '../stores/useReferralStore'

export default function ReferralRedirectPage() {
  const { code } = useParams()
  const setCode = useReferralStore((s) => s.set)

  useEffect(() => {
    if (code) {
      setCode(code)
      toast.message('Kode referral aktif', {
        description: `Kamu berbelanja via referral ${code.toUpperCase()}`,
      })
    }
  }, [code, setCode])

  return <Navigate to="/" replace />
}
