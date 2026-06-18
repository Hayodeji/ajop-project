import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetUser, adminDeleteUser, adminUpdateUser } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'


const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [confirmRemove, setConfirmRemove] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminGetUser(userId!),
    enabled: !!userId,
  })



  const removeUser = useMutation({
    mutationFn: () => adminDeleteUser(userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(`${profile?.name ?? 'User'} has been removed`)
      navigate('/admin/users', { replace: true })
    },
    onError: (e: any) => toast.error(e.message || 'Failed to remove user'),
  })

  const toggleLock = useMutation({
    mutationFn: (suspend: boolean) => adminUpdateUser(userId!, { suspended: suspend }),
    onSuccess: (_, suspended) => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] })
      toast.success(suspended ? 'Admin locked' : 'Admin unlocked')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update lock status'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return <div className="text-slate-400 text-center py-20">User not found</div>

  const { profile, subscription, groups, stats } = data

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/admin/users" className="text-slate-400 hover:text-white text-sm">← Users</Link>
          <h1 className="text-2xl font-bold text-white mt-2">{profile?.name}</h1>
          <p className="text-slate-400 text-sm">{profile?.phone ?? 'No phone'}</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.is_suspended ? (
            <button
              onClick={() => toggleLock.mutate(false)}
              disabled={toggleLock.isPending}
              className="text-xs font-semibold text-green-400 border border-green-800/60 hover:border-green-600 hover:bg-green-900/20 px-4 py-2 rounded-lg transition-colors"
            >
              {toggleLock.isPending ? 'Unlocking…' : 'Unlock Admin'}
            </button>
          ) : (
            <button
              onClick={() => toggleLock.mutate(true)}
              disabled={toggleLock.isPending}
              className="text-xs font-semibold text-amber-400 border border-amber-800/60 hover:border-amber-600 hover:bg-amber-900/20 px-4 py-2 rounded-lg transition-colors"
            >
              {toggleLock.isPending ? 'Locking…' : 'Lock Admin'}
            </button>
          )}

          {!confirmRemove ? (
            <button
              onClick={() => setConfirmRemove(true)}
              className="text-xs font-semibold text-red-400 border border-red-800/60 hover:border-red-600 hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
            >
              Remove Admin
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Are you sure?</span>
              <button
                onClick={() => removeUser.mutate()}
                disabled={removeUser.isPending}
                className="text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                {removeUser.isPending ? 'Removing…' : 'Yes, Remove'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-5 col-span-2">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            Admin Details
            {profile?.is_suspended && (
              <Badge tone="danger">Locked</Badge>
            )}
          </h2>
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
            <Badge tone={subscription.status === 'active' ? 'success' : subscription.status === 'trialing' ? 'warning' : 'danger'}>
              {subscription.status}
            </Badge>
            <span className="text-white capitalize">{subscription.plan} plan</span>
            {subscription.trial_ends_at && (
              <span className="text-slate-400 text-sm">Trial ends {formatDate(subscription.trial_ends_at)}</span>
            )}
          </div>
        </Card>
      )}


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
