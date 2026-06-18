import { useQuery } from '@tanstack/react-query'
import { adminGetStats, adminGetEngagement } from '@/lib/adminApi'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444']

const SHORT_WEEK = (w: string) => {
  // "2026-W19" → "W19"
  const parts = w.split('-')
  return parts[1] ?? w
}

const UserEngagement = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats })
  const { data: eng, isLoading: engLoading } = useQuery({ queryKey: ['admin-engagement'], queryFn: adminGetEngagement })

  if (statsLoading || engLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const planData = Object.entries(eng?.planDistribution ?? {}).map(([name, value]) => ({ name, value: value as number }))
  const statusData = Object.entries(eng?.statusDistribution ?? {})
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({ name, value: value as number }))

  const engagementMetrics = [
    {
      label: 'Acquisition',
      value: stats?.totalUsers ?? 0,
      sub: 'Total registered admins',
      icon: '📈',
      color: 'text-green-400',
    },
    {
      label: 'Retention',
      value: `${eng?.conversionRate ?? 0}%`,
      sub: 'Trial → Active conversion',
      icon: '🛡️',
      color: 'text-blue-400',
    },
    {
      label: 'Activity',
      value: eng?.avgGroupsPerUser ?? 0,
      sub: 'Avg groups per admin',
      icon: '🫙',
      color: 'text-purple-400',
    },
    {
      label: 'Transaction Vol',
      value: formatKobo(stats?.totalPayoutAmount ?? 0),
      sub: 'Total payouts processed',
      icon: '💰',
      color: 'text-orange-400',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">User Engagement</h1>
        <p className="text-slate-400 text-sm mt-1">Growth and activity metrics for the AjoPot platform</p>
      </div>

      {/* KPI cards */}
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly signups bar chart */}
        <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-1">Weekly Sign-ups</h3>
          <p className="text-slate-500 text-xs mb-4">New admin registrations over the last 8 weeks</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(eng?.weeklySignups ?? []).map((d: any) => ({ ...d, week: SHORT_WEEK(d.week) }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Sign-ups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Plan distribution donut */}
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Plan Mix</h3>
          <p className="text-slate-500 text-xs mb-4">Current distribution of subscription plans</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-slate-400 text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick stats + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'New this week', value: stats?.newUsersThisWeek ?? 0 },
              { label: 'New today', value: stats?.newUsersToday ?? 0 },
              { label: 'Trialing', value: eng?.statusDistribution?.trialing ?? 0 },
              { label: 'Active subs', value: eng?.statusDistribution?.active ?? 0 },
              { label: 'Total members managed', value: eng?.totalMembersManaged ?? 0 },
              { label: 'Paid contributions', value: stats?.totalContributions ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-white font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subscription status breakdown */}
        <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-1">Subscription Health</h3>
          <p className="text-slate-500 text-xs mb-4">Breakdown of all subscription statuses</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={88} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Users">
                  {statusData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.name === 'active' ? '#22c55e'
                          : entry.name === 'trialing' ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default UserEngagement
