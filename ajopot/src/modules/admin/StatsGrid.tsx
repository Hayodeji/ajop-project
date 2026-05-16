import { Card } from '@/components/ui/Card'
import { formatKobo } from '@/lib/utils'

interface Props {
  stats: any
}

export const StatsGrid = ({ stats }: Props) => {
  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? stats?.total_users ?? 0, sub: `+${stats?.newUsersToday ?? stats?.new_users_today ?? 0} today` },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? stats?.active_subscriptions ?? 0, sub: `${stats?.trialSubscriptions ?? stats?.trial_subscriptions ?? 0} on trial` },
    { label: 'Total Groups', value: stats?.totalGroups ?? stats?.total_groups ?? 0, sub: '' },
    { label: 'Paid Contributions', value: stats?.totalContributions ?? stats?.total_contributions ?? 0, sub: '' },
    { label: 'Total Payouts', value: formatKobo(stats?.totalPayoutAmount ?? stats?.total_payout_amount ?? 0), sub: 'all time' },
    { label: 'New This Week', value: stats?.newUsersThisWeek ?? stats?.new_users_this_week ?? 0, sub: 'signups' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((s) => (
        <Card key={s.label} className="bg-slate-800 border-slate-700 p-5">
          <div className="text-slate-400 text-sm">{s.label}</div>
          <div className="text-2xl font-bold text-white mt-1">{s.value}</div>
          {s.sub && <div className="text-xs text-slate-500 mt-1">{s.sub}</div>}
        </Card>
      ))}
    </div>
  )
}
