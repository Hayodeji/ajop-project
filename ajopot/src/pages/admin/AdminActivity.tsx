import { useQuery } from '@tanstack/react-query'
import { adminGetActivity } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

const ICONS: Record<string, string> = { signup: '👤', payout: '💸', group: '🫙', subscription: '💳' }
const COLORS: Record<string, string> = {
  signup: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  payout: 'bg-green-500/10 border-green-500/20 text-green-400',
  group: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  subscription: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
}

const AdminActivity = () => {
  const { data: activity, isLoading } = useQuery({ queryKey: ['admin-activity'], queryFn: adminGetActivity })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-slate-400 text-sm mt-1">Recent platform-wide events</p>
      </div>

      <div className="space-y-2">
        {(activity ?? []).map((a: any, i: number) => (
          <div key={i} className="flex items-start gap-4 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-base shrink-0 ${COLORS[a.type] ?? 'bg-slate-700 text-slate-300'}`}>
              {ICONS[a.type] ?? '📌'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-200">{a.label}</div>
              {a.meta && <div className="text-xs text-slate-500 mt-0.5">{a.meta}</div>}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">{formatDate(a.time)}</div>
          </div>
        ))}
        {!activity?.length && <p className="text-slate-500 text-sm text-center py-12">No activity recorded yet</p>}
      </div>
    </div>
  )
}


export default AdminActivity;
