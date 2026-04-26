import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedRoute() {
  const session = useAuthStore((s) => s.session)
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped)
  const location = useLocation()

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-600">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
