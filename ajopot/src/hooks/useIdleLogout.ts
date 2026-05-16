import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

const IDLE_TIME = 30 * 60 * 1000 // 30 minutes

export const useIdleLogout = () => {
  const logout = useAuthStore((s) => s.logout)
  const session = useAuthStore((s) => s.session)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      console.log('User idle for 30 minutes. Logging out...')
      logout()
    }, IDLE_TIME)
  }

  useEffect(() => {
    if (!session) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    // Initial timer
    resetTimer()

    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [session, logout])
}
