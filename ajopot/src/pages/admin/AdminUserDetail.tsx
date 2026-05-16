import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetUser, adminSetUserLimits } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLAN_GROUP_DEFAULTS: Record<string, number> = { basic: 1, smart: 5, pro: 20 }
const PLAN_MEMBER_DEFAULTS: Record<string, number> = { basic: 10, smart: 30, pro: 100 }

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminGetUser(userId!),
    enabled: !!userId,
  })

  const plan: string = data?.subscription?.plan ?? data?.profile?.plan ?? 'basic'
  const sub = data?.subscription ?? {}

  // Local form state for custom limits
  const [groupLimit, setGroupLimit] = useState<string>('')
  const [memberLimit, setMemberLimit] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [limitsOpen, setLimitsOpen] = useState(false)

  const setLimits = useMutation({
    mutationFn: (body: {
      custom_group_limit: number | null
      custom_member_limit: number | null
      limits_note: string | null
    }) => adminSetUserLimits(userId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] })
      toast.success('Custom limits saved')
      setGroupLimit('')
      setMemberLimit('')
      setNote('')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save limits'),
  })

  const handleSaveLimits = () => {
    const gl = groupLimit.trim() === '' ? null : Number(groupLimit)
    const ml = memberLimit.trim() === '' ? null : Number(memberLimit)
    if ((gl !== null && (isNaN(gl) || gl < 1)) || (ml !== null && (isNaN(ml) || ml < 1))) {
      toast.error('Limits must be positive numbers')
      return
    }
    setLimits.mutate({
      custom_group_limit: gl,
      custom_member_limit: ml,
      limits_note: note || null,
    })
  }

  const handleClearLimit = (field: 'group' | 'member') => {
    setLimits.mutate({
      custom_group_limit:  field === 'group'  ? null : (sub.custom_group_limit  ?? null),
      custom_member_limit: field === 'member' ? null : (sub.custom_member_limit ?? null),
      limits_note: sub.limits_note ?? null,
    })
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return <div className="text-slate-400 text-center py-20">User not found</div>

  const { profile, subscription, groups, stats } = data

  const effectiveGroupLimit  = sub.custom_group_limit  ?? PLAN_GROUP_DEFAULTS[plan]  ?? 1
  const effectiveMemberLimit = sub.custom_member_limit ?? PLAN_MEMBER_DEFAULTS[plan] ?? 10
  const hasCustomGroup       = sub.custom_group_limit  != null
  const hasCustomMember      = sub.custom_member_limit != null

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="text-slate-400 hover:text-white text-sm">← Users</Link>
        <h1 className="text-2xl font-bold text-white mt-2">{profile?.name}</h1>
        <p className="text-slate-400 text-sm">{profile?.phone ?? 'No phone'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-5 col-span-2">
          <h2 className="font-semibold text-white mb-4">Admin Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Name</span><div className="text-white font-medium mt-0.5">{profile?.name}</div></div>
            <div><span className="text-slate-400">Phone</span><div className="text-white font-medium mt-0.5">{profile?.phone}</div></div>
            <div><span className="text-slate-400">Email</span><div className="text-white font-medium mt-0.5">{profile?.email ?? '—'}</div></div>
            <div><span className="text-slate-400">Current Plan</span><div className="text-white font-medium capitalize mt-0.5">{profile?.plan}</div></div>
            <div><span className="text-slate-400">Joined</span><div className="text-white mt-0.5">{profile?.created_at ? formatDate(profile.created_at) : '—'}</div></div>
            <div><span className="text-slate-400">Referral code</span><div className="text-white mt-0.5">{profile?.referral_code ?? '—'}</div></div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-4">Stats</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-slate-400">Groups</span><div className="text-white text-xl font-bold mt-0.5">{groups?.length ?? 0}</div></div>
            <div><span className="text-slate-400">Paid contributions</span><div className="text-white font-bold mt-0.5">{stats?.totalContributions ?? 0}</div></div>
            <div><span className="text-slate-400">Total payouts</span><div className="text-white font-bold mt-0.5">{formatKobo(stats?.totalPayoutAmount ?? 0)}</div></div>
          </div>
        </Card>
      </div>

      {subscription && (
        <Card className="bg-slate-800 border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-3">Subscription</h2>
          <div className="flex items-center gap-3">
            <Badge tone={subscription.status === 'active' ? 'success' : subscription.status === 'trial' ? 'warning' : 'danger'}>
              {subscription.status}
            </Badge>
            <span className="text-white capitalize">{subscription.plan} plan</span>
            {subscription.trial_ends_at && (
              <span className="text-slate-400 text-sm">Trial ends {formatDate(subscription.trial_ends_at)}</span>
            )}
          </div>
        </Card>
      )}

      {/* ── Custom Limits Panel ── */}
      <Card className="bg-slate-800 border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">Usage Limits</h2>
            <p className="text-slate-500 text-xs mt-0.5">Override plan defaults for this specific user</p>
          </div>
          <button
            onClick={() => setLimitsOpen(o => !o)}
            className="text-xs text-green-400 hover:text-green-300 font-medium border border-green-800 hover:border-green-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {limitsOpen ? 'Cancel' : 'Edit Limits'}
          </button>
        </div>

        {/* Current effective limits display */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-xs mb-1">Max Groups</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">{effectiveGroupLimit}</span>
              {hasCustomGroup && (
                <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-medium">
                  Custom
                </span>
              )}
            </div>
            <div className="text-slate-600 text-xs mt-1">
              Plan default: {PLAN_GROUP_DEFAULTS[plan] ?? '—'}
            </div>
            {hasCustomGroup && (
              <button
                onClick={() => handleClearLimit('group')}
                disabled={setLimits.isPending}
                className="text-xs text-red-400 hover:text-red-300 mt-2 disabled:opacity-40 transition-colors"
              >
                Reset to plan default
              </button>
            )}
          </div>

          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-xs mb-1">Max Members / Group</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">{effectiveMemberLimit}</span>
              {hasCustomMember && (
                <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-medium">
                  Custom
                </span>
              )}
            </div>
            <div className="text-slate-600 text-xs mt-1">
              Plan default: {PLAN_MEMBER_DEFAULTS[plan] ?? '—'}
            </div>
            {hasCustomMember && (
              <button
                onClick={() => handleClearLimit('member')}
                disabled={setLimits.isPending}
                className="text-xs text-red-400 hover:text-red-300 mt-2 disabled:opacity-40 transition-colors"
              >
                Reset to plan default
              </button>
            )}
          </div>
        </div>

        {sub.limits_note && (
          <div className="text-xs text-slate-500 italic mt-2 mb-1">
            Note: {sub.limits_note}
          </div>
        )}

        {/* Edit form */}
        {limitsOpen && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-4">
            <p className="text-slate-400 text-xs">
              Enter new values below. Leave a field blank to keep its current value unchanged.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">
                  Max Groups
                </label>
                <input
                  id="custom-group-limit"
                  type="number"
                  min={1}
                  placeholder={`Current: ${effectiveGroupLimit}`}
                  value={groupLimit}
                  onChange={e => setGroupLimit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">
                  Max Members / Group
                </label>
                <input
                  id="custom-member-limit"
                  type="number"
                  min={1}
                  placeholder={`Current: ${effectiveMemberLimit}`}
                  value={memberLimit}
                  onChange={e => setMemberLimit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">
                Reason / Note <span className="text-slate-600">(optional — shown in audit)</span>
              </label>
              <input
                id="limits-note"
                type="text"
                placeholder="e.g. Special arrangement for enterprise client"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveLimits}
                disabled={setLimits.isPending || (groupLimit === '' && memberLimit === '')}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {setLimits.isPending ? 'Saving…' : 'Save Custom Limits'}
              </button>
              <button
                onClick={() => setLimits.mutate({ custom_group_limit: null, custom_member_limit: null, limits_note: null })}
                disabled={setLimits.isPending || (!hasCustomGroup && !hasCustomMember)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Clear All Overrides
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Managed Groups table */}
      <div className="space-y-4">
        <h2 className="font-semibold text-white text-lg">Managed Groups ({groups?.length ?? 0})</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Group Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Frequency</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Members</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Contribution</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Cycle</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(groups ?? []).map((g: any) => (
                <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{g.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{g.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{g.frequency}</td>
                  <td className="px-4 py-3 text-slate-300">{g.member_count} members</td>
                  <td className="px-4 py-3 text-green-400 font-bold">{formatKobo(g.contribution_amount)}</td>
                  <td className="px-4 py-3 text-slate-300">Cycle #{g.current_cycle}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(g.created_at)}</td>
                </tr>
              ))}
              {!groups?.length && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No groups managed by this user yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member cards */}
      <div className="space-y-4">
        <h2 className="font-semibold text-white text-lg">Member Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(groups ?? []).map((g: any) => (
            <Card key={g.id} className="bg-slate-900 border-slate-800 p-4">
              <h3 className="text-green-400 font-bold mb-3 flex justify-between items-center">
                <span>{g.name}</span>
                <span className="text-slate-500 text-xs font-normal">{g.member_count} members</span>
              </h3>
              <div className="space-y-2">
                {g.members?.length ? g.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800 last:border-0">
                    <div className="text-slate-200">
                      <span className="text-slate-500 mr-2">{m.payout_position}.</span>
                      {m.name}
                    </div>
                    <div className="text-slate-500">{m.phone}</div>
                  </div>
                )) : <div className="text-slate-600 text-xs italic">No members listed in summary</div>}
              </div>
            </Card>
          ))}
          {!groups?.length && <p className="text-slate-500 text-sm">No members to display</p>}
        </div>
      </div>
    </div>
  )
}

export default AdminUserDetail
