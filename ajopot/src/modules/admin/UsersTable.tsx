import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { PLAN_TONE, STATUS_TONE } from '@/lib/constants'

interface Props {
  users: any[]
}

export const UsersTable = ({ users }: Props) => {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-700">
          {['Name', 'Phone', 'Plan', 'Status', 'Groups', 'Joined'].map(h => (
            <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u: any) => {
          const userId = u.user_id || u.id
          const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions
          return (
            <tr key={userId} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="px-4 py-3 text-white font-medium">
                <Link to={`/admin/users/${userId}`} className="hover:text-green-400">{u.name}</Link>
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
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
