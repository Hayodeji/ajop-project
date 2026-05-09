import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { useSubscription } from '@/hooks/useSubscription'
import PaymentWallPage from '@/pages/auth/PaymentWallPage'

const ProtectedRoute = () => {
  const session = useAuthStore((s) => s.session)
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped)
  const location = useLocation()
  
  const { data: sub, isLoading: subLoading, isError } = useSubscription()
  const isStuck = session && subLoading && !isError

  if (!isBootstrapped || isStuck) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-green-600 bg-slate-50">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
        <button 
          onClick={() => useAuthStore.getState().logout()}
          className="mt-8 text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Taking too long? Log out
        </button>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (sub && (sub.status === 'payment_failed' || sub.status === 'expired')) {
    if (!location.pathname.startsWith('/plan-select') && !location.pathname.startsWith('/payment/callback')) {
      return <PaymentWallPage subscription={sub} />
    }
  }

  return <Outlet />
}


export default ProtectedRoute;
