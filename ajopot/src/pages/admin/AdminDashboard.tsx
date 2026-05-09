import { useQuery } from '@tanstack/react-query'
import { adminGetStats, adminGetActivity } from '@/lib/adminApi'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, string> = {
  signup: '👤',
  payout: '💸',
  group: '🫙',
  subscription: '💳',
}

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats })
  const { data: activity } = useQuery({ queryKey: ['admin-activity'], queryFn: adminGetActivity })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, sub: `+${stats?.newUsersToday ?? 0} today` },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? 0, sub: `${stats?.trialSubscriptions ?? 0} on trial` },
    { label: 'Total Groups', value: stats?.totalGroups ?? 0, sub: '' },
    { label: 'Paid Contributions', value: stats?.totalContributions ?? 0, sub: '' },
    { label: 'Total Payouts', value: formatKobo(stats?.totalPayoutAmount ?? 0), sub: 'all time' },
    { label: 'New This Week', value: stats?.newUsersThisWeek ?? 0, sub: 'signups' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Live snapshot of AjoPot activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-slate-800 border-slate-700 p-5">
            <div className="text-slate-400 text-sm">{s.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{s.value}</div>
            {s.sub && <div className="text-xs text-slate-500 mt-1">{s.sub}</div>}
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {(activity ?? []).slice(0, 20).map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
              <span className="text-lg">{ACTIVITY_ICONS[a.type] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200">{a.label}</div>
                <div className="text-xs text-slate-500">{a.meta}</div>
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap">{formatDate(a.time)}</div>
            </div>
          ))}
          {!activity?.length && <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>}
        </div>
      </div>
    </div>
  )
}


export default AdminDashboard;
