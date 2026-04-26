import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminGetUsers, adminUpdateUser } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLAN_TONE: Record<string, any> = { basic: 'neutral', smart: 'info', pro: 'brand' }
const STATUS_TONE: Record<string, any> = { active: 'success', trial: 'warning', cancelled: 'danger', expired: 'danger' }

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminGetUsers(page, search || undefined),
  })

  const update = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: any }) => adminUpdateUser(userId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated') },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} registered ajo-admins</p>
        </div>
        <input
          placeholder="Search name or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-60"
        />
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Name', 'Phone', 'Plan', 'Status', 'Groups', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((u: any) => {
                const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions
                return (
                  <tr key={u.user_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <Link to={`/admin/users/${u.user_id}`} className="hover:text-green-400">{u.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PLAN_TONE[sub?.plan ?? u.plan] ?? 'neutral'}>{sub?.plan ?? u.plan ?? 'basic'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? <Badge tone={STATUS_TONE[sub.status] ?? 'neutral'}>{sub.status}</Badge> : <span className="text-slate-500 text-xs">No sub</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.groups_count}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (!e.target.value) return
                          update.mutate({ userId: u.user_id, body: { plan: e.target.value } })
                          e.target.value = ''
                        }}
                        className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none"
                      >
                        <option value="">Change plan...</option>
                        <option value="basic">Basic</option>
                        <option value="smart">Smart</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
              {!data?.data?.length && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No users found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {(data?.total ?? 0) > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">Page {page} of {Math.ceil((data?.total ?? 0) / 20)}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Prev</button>
                <button disabled={page * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
