import { useParams, Navigate } from 'react-router-dom'

export default function ReferralRedirectPage() {
  const { code } = useParams()
  return <Navigate to={`/register?ref=${encodeURIComponent(code?.toUpperCase() || '')}`} replace />
}
