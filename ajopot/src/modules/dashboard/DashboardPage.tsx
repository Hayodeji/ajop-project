import { Link } from 'react-router-dom'
import { useGroups } from '@/hooks/useGroups'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'
import { EmptyDashboard } from './EmptyDashboard'
import { Group, Subscription } from '@/types'

// ─── Plan Config ───────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  basic:  { icon: '✅', color: 'from-slate-500 to-slate-700',  badge: 'bg-slate-100 text-slate-700'  },
  smart:  { icon: '🚀', color: 'from-green-500 to-emerald-700', badge: 'bg-green-100 text-green-700'  },
  pro:    { icon: '💎', color: 'from-purple-500 to-violet-700', badge: 'bg-purple-100 text-purple-700' },
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const SubscriptionCard = ({ sub }: { sub: Subscription }) => {
  const cfg = PLAN_CONFIG[sub.plan] ?? PLAN_CONFIG.basic
  const isTrialing = sub.status === 'trialing'
  const trialDaysLeft = isTrialing && sub.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${cfg.color} p-5 text-white overflow-hidden shadow-lg`}>
      {/* Background decoration */}
      <div className="absolute right-4 top-4 text-4xl opacity-20 select-none">{cfg.icon}</div>
      <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{cfg.icon}</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
            {sub.plan.toUpperCase()} PLAN
          </span>
          {isTrialing && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
              FREE TRIAL
            </span>
          )}
        </div>

        <p className="text-white/70 text-sm mb-1">Subscription Status</p>
        <p className="text-2xl font-bold capitalize tracking-tight">
          {isTrialing ? `${trialDaysLeft} days left` : sub.status}
        </p>
        {isTrialing && sub.trial_ends_at && (
          <p className="text-white/60 text-xs mt-1">Trial ends {formatDate(sub.trial_ends_at)}</p>
        )}
      </div>

      <Link
        to="/profile"
        className="relative z-10 mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white transition-colors"
      >
        Manage Subscription →
      </Link>
    </div>
  )
}

const StatCard = ({
  label, value, sub, icon, to, color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: string
  to?: string
  color: string
}) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group`}>
    <div className="flex items-start justify-between">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
        {icon}
      </div>
      {to && (
        <Link to={to} className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          View →
        </Link>
      )}
    </div>
    <div className="mt-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

const GroupCard = ({ group }: { group: Group }) => {
  const totalPot = group.contribution_amount * group.member_count
  return (
    <Link
      to={`/groups/${group.id}`}
      className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{group.name}</h3>
          <p className="text-xs text-gray-400 mt-1 capitalize">{group.frequency} contributions</p>
        </div>
        <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">
          Cycle #{group.current_cycle}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-400">Members</p>
          <p className="text-base font-bold text-gray-900">{group.member_count}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Per Cycle</p>
          <p className="text-base font-bold text-gray-900">{formatKobo(group.contribution_amount)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Pot Value</p>
          <p className="text-base font-bold text-green-600">{formatKobo(totalPot)}</p>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const profile = useAuthStore((s) => s.user)
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { data: sub, isLoading: subLoading } = useSubscription()

  if (groupsLoading || subLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm animate-pulse">Loading your dashboard…</p>
      </div>
    )
  }

  const totalMembers = groups?.reduce((s, g) => s + g.member_count, 0) ?? 0
  const totalContributions = groups?.reduce((s, g) => s + g.contribution_amount, 0) ?? 0
  const totalPot = groups?.reduce((s, g) => s + g.contribution_amount * g.member_count, 0) ?? 0
  const firstName = profile?.phone ? '' : 'there'

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Good day{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {profile?.phone ?? 'Welcome to your Ajo Manager dashboard'}
          </p>
        </div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          + New Group
        </Link>
      </div>

      {/* Subscription Card */}
      {sub && <SubscriptionCard sub={sub} />}

      {groups && groups.length > 0 ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Groups"
              value={groups.length}
              icon="🏦"
              color="bg-blue-50"
              to="/groups"
            />
            <StatCard
              label="Total Members"
              value={totalMembers}
              icon="👥"
              color="bg-green-50"
            />
            <StatCard
              label="Per-cycle Total"
              value={formatKobo(totalContributions)}
              sub="across all groups"
              icon="💰"
              color="bg-amber-50"
            />
            <StatCard
              label="Max Pot Value"
              value={formatKobo(totalPot)}
              sub="full rotation"
              icon="🎯"
              color="bg-purple-50"
            />
          </div>

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Groups</h2>
              <Link to="/groups" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/groups', label: 'Manage Groups', icon: '🏦' },
                { to: '/profile', label: 'Subscription', icon: '💳' },
                { to: '/profile?tab=faq', label: 'Help & FAQ', icon: '❓' },
                { to: '/groups', label: 'Record Payment', icon: '✍️' },
              ].map((item) => (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-4 text-center"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-medium text-white/80">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyDashboard />
      )}
    </div>
  )
}

export default DashboardPage
