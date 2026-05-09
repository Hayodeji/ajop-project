import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/groups', label: 'Groups' },
  { to: '/settings', label: 'Settings' },
  { to: '/faq', label: 'FAQ' },
]

const AppShell = () => {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center text-sm">
              A
            </div>
            <span className="font-semibold text-slate-900">Ajo Manager</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            aria-label={`Sign out ${user?.phone ?? ''}`}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Outlet />
        </div>
      </main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              cn(
                'flex-1 py-3 text-center text-xs font-medium transition-colors',
                isActive ? 'text-brand-700' : 'text-slate-500',
              )
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}


export default AppShell;
