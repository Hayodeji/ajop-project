import { useQuery } from '@tanstack/react-query'
import { adminGetStats } from '@/lib/adminApi'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo } from '@/lib/utils'

const UserEngagement = () => {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const engagementMetrics = [
    { 
      label: 'Acquisition', 
      value: stats?.totalUsers ?? stats?.total_users ?? 0, 
      sub: 'Total registered admins',
      icon: '📈',
      color: 'text-green-400'
    },
    { 
      label: 'Retention', 
      value: stats?.activeSubscriptions ?? stats?.active_subscriptions ?? 0, 
      sub: 'Paid & Active subscribers',
      icon: '🛡️',
      color: 'text-blue-400'
    },
    { 
      label: 'Activity', 
      value: stats?.totalGroups ?? stats?.total_groups ?? 0, 
      sub: 'Total groups managed',
      icon: '🫙',
      color: 'text-purple-400'
    },
    { 
      label: 'Transaction Vol', 
      value: formatKobo(stats?.totalPayoutAmount ?? stats?.total_payout_amount ?? 0), 
      sub: 'Total payouts processed',
      icon: '💰',
      color: 'text-orange-400'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">User Engagement</h1>
        <p className="text-slate-400 text-sm mt-1">Growth and activity metrics for the AjoPot platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {engagementMetrics.map((m) => (
          <Card key={m.label} className="bg-slate-900 border-slate-800 p-6 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
              {m.icon}
            </div>
            <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">{m.label}</div>
            <div className="text-3xl font-bold text-white mt-3">{m.value}</div>
            <div className={`text-xs mt-2 font-medium ${m.color}`}>{m.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Usage Trends
          </h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-600">
            Engagement trend visualization will appear here
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">New this week</span>
              <span className="text-white font-medium">{stats?.newUsersThisWeek ?? stats?.new_users_this_week ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">New today</span>
              <span className="text-white font-medium">{stats?.newUsersToday ?? stats?.new_users_today ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Trial users</span>
              <span className="text-white font-medium">{stats?.trialSubscriptions ?? stats?.trial_subscriptions ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Paid contributions</span>
              <span className="text-white font-medium">{stats?.totalContributions ?? stats?.total_contributions ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default UserEngagement
