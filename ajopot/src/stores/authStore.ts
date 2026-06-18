import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isBootstrapped: boolean
  isNewUser: boolean
  isAdmin: boolean | null
  setSession: (session: Session | null) => void
  setIsNewUser: (v: boolean) => void
  setIsAdmin: (v: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isBootstrapped: false,
  isNewUser: false,
  isAdmin: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isBootstrapped: true,
      // Reset admin status when session changes so AdminRoute re-verifies
      isAdmin: null,
    }),
  setIsNewUser: (v) => set({ isNewUser: v }),
  setIsAdmin: (v) => set({ isAdmin: v }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAdmin: null })
  },
}))
