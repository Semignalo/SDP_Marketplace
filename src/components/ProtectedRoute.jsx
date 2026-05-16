import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { Spinner } from './ui'

export default function ProtectedRoute({ children, roles }) {
  const user = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
