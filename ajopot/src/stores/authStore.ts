import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isBootstrapped: boolean
  isNewUser: boolean
  setSession: (session: Session | null) => void
  setIsNewUser: (v: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isBootstrapped: false,
  isNewUser: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isBootstrapped: true,
    }),
  setIsNewUser: (v) => set({ isNewUser: v }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
