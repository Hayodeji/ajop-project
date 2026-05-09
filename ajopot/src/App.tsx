import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { router } from '@/routes'
import { useAuthStore } from '@/stores/authStore'

const App = () => {
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [setSession])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}


export default App;
