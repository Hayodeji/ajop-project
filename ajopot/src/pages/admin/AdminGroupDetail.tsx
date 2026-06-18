import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminGetGroup } from '@/lib/adminApi'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'

const STATUS_TONE: Record<string, any> = {
  paid: 'success',
  pending: 'warning',
  late: 'danger',
}

const AdminGroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-group', groupId],
    queryFn: () => adminGetGroup(groupId!),
    enabled: !!groupId,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data?.group) return <div className="text-slate-400 text-center py-20">Group not found</div>

  const { group, members, contributions, payouts } = data
  const potValue = group.contribution_amount * (group.member_count ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/groups" className="text-slate-400 hover:text-white text-sm">← Groups</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            <p className="text-slate-400 text-sm capitalize mt-0.5">{group.frequency} · Cycle #{group.current_cycle}</p>
          </div>
          <div className="text-right">
            <div className="text-green-400 text-xl font-bold">{formatKobo(potValue)}</div>
            <div className="text-slate-500 text-xs mt-0.5">pot value</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Per cycle', value: formatKobo(group.contribution_amount) },
          { label: 'Member slots', value: group.member_count },
          { label: 'Active members', value: members?.filter((m: any) => m.is_active).length ?? 0 },
          { label: 'Total payouts', value: formatKobo(payouts?.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) ?? 0) },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-slate-800 border-slate-700 p-4">
            <div className="text-slate-400 text-xs">{label}</div>
            <div className="text-white font-bold text-lg mt-1">{value}</div>
          </Card>
        ))}
      </div>

      {/* Members */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white text-lg">Members ({members?.length ?? 0})</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['#', 'Name', 'Phone', 'Bank', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m: any) => (
                <tr key={m.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-500 font-mono">{m.payout_position}</td>
                  <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-slate-300">{m.phone}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {m.bank_name ? `${m.bank_name} ···${(m.account_number ?? '').slice(-4)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={m.is_active ? 'success' : 'neutral'}>{m.is_active ? 'Active' : 'Removed'}</Badge>
                  </td>
                </tr>
              ))}
              {!members?.length && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contributions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white text-lg">Recent Contributions ({contributions?.length ?? 0})</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Member', 'Cycle', 'Status', 'Due', 'Paid at'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(contributions ?? []).map((c: any) => {
                const member = members?.find((m: any) => m.id === c.member_id)
                return (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{member?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">#{c.cycle_number}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.due_date ? formatDate(c.due_date) : '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.paid_at ? formatDate(c.paid_at) : '—'}</td>
                  </tr>
                )
              })}
              {!contributions?.length && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No contributions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payouts */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white text-lg">Payouts ({payouts?.length ?? 0})</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Member', 'Cycle', 'Amount', 'Paid out'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p: any) => {
                const member = members?.find((m: any) => m.id === p.member_id)
                return (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{member?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">#{p.cycle_number}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">{formatKobo(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.paid_out_at ? formatDate(p.paid_out_at) : '—'}</td>
                  </tr>
                )
              })}
              {!payouts?.length && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-500">No payouts recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminGroupDetail
