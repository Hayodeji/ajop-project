import { formatDate } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, string> = {
  signup: '👤',
  payout: '💸',
  group: '🫙',
  subscription: '💳',
}

interface Props {
  activity: any[]
}

export const ActivityList = ({ activity }: Props) => {
  return (
    <div className="space-y-2">
      {(activity ?? []).slice(0, 20).map((a: any, i: number) => (
        <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
          <span className="text-lg">{ACTIVITY_ICONS[a.type] ?? '📌'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200">{a.label}</div>
            <div className="text-xs text-slate-500">{a.meta}</div>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">{formatDate(a.time)}</div>
        </div>
      ))}
      {!activity?.length && <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>}
    </div>
  )
}
