import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'

export default function AdminRoute() {
  const { session, isBootstrapped } = useAuthStore()
  if (!isBootstrapped) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner size="lg" /></div>
  if (!session) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
