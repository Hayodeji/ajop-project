import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminGetSubscriptions } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

const PLAN_TONE: Record<string, any> = { basic: 'neutral', smart: 'info', pro: 'brand' }
const STATUS_TONE: Record<string, any> = { active: 'success', trial: 'warning', cancelled: 'danger', expired: 'danger' }

export default function AdminSubscriptions() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', page],
    queryFn: () => adminGetSubscriptions(page),
  })

  const planCount = (plan: string) =>
    (data?.data ?? []).filter((s: any) => s.plan === plan).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} total subscription records</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['basic', 'smart', 'pro'].map(plan => (
          <div key={plan} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="text-slate-400 text-sm capitalize">{plan}</div>
            <div className="text-2xl font-bold text-white mt-1">{planCount(plan)}</div>
          </div>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['User', 'Phone', 'Plan', 'Status', 'Trial ends', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((s: any) => {
                const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
                return (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{profile?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{profile?.phone ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={PLAN_TONE[s.plan]}>{s.plan}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.trial_ends_at ? formatDate(s.trial_ends_at) : '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.created_at)}</td>
                  </tr>
                )
              })}
              {!data?.data?.length && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No subscriptions yet</td></tr>
              )}
            </tbody>
          </table>
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
