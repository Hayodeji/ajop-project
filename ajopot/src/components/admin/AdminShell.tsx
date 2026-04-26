import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/groups', label: 'Groups', icon: '🫙' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  { to: '/admin/activity', label: 'Activity', icon: '📋' },
]

export default function AdminShell() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500 text-white font-bold flex items-center justify-center text-sm">A</div>
            <div>
              <div className="text-white font-bold text-sm">AjoPot</div>
              <div className="text-slate-500 text-xs">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-green-600/20 text-green-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
