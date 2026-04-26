import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetUser, adminUpdateUser } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminGetUser(userId!),
    enabled: !!userId,
  })

  const update = useMutation({
    mutationFn: (body: any) => adminUpdateUser(userId!, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); toast.success('Updated') },
    onError: () => toast.error('Update failed'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return <div className="text-slate-400 text-center py-20">User not found</div>

  const { profile, subscription, groups, stats } = data

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="text-slate-400 hover:text-white text-sm">← Users</Link>
        <h1 className="text-2xl font-bold text-white mt-2">{profile?.name}</h1>
        <p className="text-slate-400 text-sm">{profile?.phone ?? 'No phone'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-5 col-span-2">
          <h2 className="font-semibold text-white mb-4">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Plan</span><div className="text-white font-medium capitalize mt-0.5">{profile?.plan}</div></div>
            <div><span className="text-slate-400">Role</span><div className="text-white font-medium mt-0.5">{profile?.role}</div></div>
            <div><span className="text-slate-400">Joined</span><div className="text-white mt-0.5">{profile?.created_at ? formatDate(profile.created_at) : '—'}</div></div>
            <div><span className="text-slate-400">Referral code</span><div className="text-white mt-0.5">{profile?.referral_code ?? '—'}</div></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
            {['basic', 'smart', 'pro'].map(plan => (
              <button
                key={plan}
                onClick={() => update.mutate({ plan })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${profile?.plan === plan ? 'bg-green-600/20 border-green-500 text-green-400' : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
              >
                {plan}
              </button>
            ))}
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
            <Badge tone={subscription.status === 'active' ? 'success' : subscription.status === 'trial' ? 'warning' : 'danger'}>{subscription.status}</Badge>
            <span className="text-white capitalize">{subscription.plan} plan</span>
            {subscription.trial_ends_at && <span className="text-slate-400 text-sm">Trial ends {formatDate(subscription.trial_ends_at)}</span>}
          </div>
        </Card>
      )}

      <div>
        <h2 className="font-semibold text-white mb-3">Groups ({groups?.length ?? 0})</h2>
        <div className="space-y-2">
          {(groups ?? []).map((g: any) => (
            <Link key={g.id} to={`/admin/groups/${g.id}`}>
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="text-white font-medium">{g.name}</div>
                  <div className="text-slate-400 text-xs capitalize">{g.frequency} · Cycle #{g.current_cycle}</div>
                </div>
                <div className="text-green-400 font-bold">{formatKobo(g.contribution_amount)}</div>
              </div>
            </Link>
          ))}
          {!groups?.length && <p className="text-slate-500 text-sm">No groups yet</p>}
        </div>
      </div>
    </div>
  )
}
