import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminGetStats, adminGetActivity, adminGetEngagement } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'
import { StatsGrid } from './StatsGrid'
import { ActivityList } from './ActivityList'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  trialing: '#f59e0b',
  expired: '#ef4444',
  cancelled: '#6b7280',
  payment_failed: '#ef4444',
}

const SHORT_WEEK = (w: string) => w.split('-')[1] ?? w

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats })
  const { data: activity } = useQuery({ queryKey: ['admin-activity'], queryFn: adminGetActivity })
  const { data: eng } = useQuery({ queryKey: ['admin-engagement'], queryFn: adminGetEngagement })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const weeklyData = (eng?.weeklySignups ?? []).map((d: any) => ({
    ...d,
    week: SHORT_WEEK(d.week),
  }))

  const statusPieData = Object.entries(eng?.statusDistribution ?? {})
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({ name, value: value as number }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Live snapshot of AjoPot activity</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link to="/admin/engagement" className="text-green-400 text-xs hover:underline">
              Full engagement →
            </Link>
          </div>
          <ActivityList activity={activity ?? []} />
        </div>

        {/* Charts panel */}
        <div className="space-y-6">
          {/* Weekly signups area chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Sign-up Trend</h2>
              <span className="text-xs text-slate-500">Last 8 weeks</span>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={22} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fill="url(#signupGrad)" name="Sign-ups" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subscription status donut */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Subscription Breakdown</h2>
            {statusPieData.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="40%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={66}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-slate-400 text-xs capitalize">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No subscription data yet</div>
            )}

            {/* Conversion rate callout */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-500 text-xs">Trial → Active conversion</span>
              <span className="text-green-400 font-bold text-sm">{eng?.conversionRate ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
