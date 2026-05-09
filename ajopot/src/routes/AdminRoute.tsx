import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { adminGetStats } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const AdminRoute = () => {
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Verifying admin access...</p>
        <button 
          onClick={() => useAuthStore.getState().logout()}
          className="mt-8 text-sm text-slate-500 hover:text-slate-300 underline"
        >
          Taking too long? Log out
        </button>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (isAdmin === false) return <Navigate to="/login" replace />

  return <Outlet />
}


export default AdminRoute;
