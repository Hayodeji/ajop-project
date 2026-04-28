import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { adminGetStats } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function AdminRoute() {
  const { session, isBootstrapped } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isBootstrapped || !session) return
    adminGetStats()
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false))
  }, [isBootstrapped, session])

  if (!isBootstrapped || (session && isAdmin === null)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />
  if (isAdmin === false) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
