import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicGroup } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'
import { ContributionStatus, GroupMember, Contribution } from '@/types'

const STATUS_TONE: Record<ContributionStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  late: 'danger',
}

const GroupPublicView = () => {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-group', token],
    queryFn: () => getPublicGroup(token!),
    enabled: !!token,
  })

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )

  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-700">Group not found</h2>
          <p className="text-gray-400 text-sm mt-1">This link may be invalid or expired</p>
        </div>
      </div>
    )

  const { group, members, contributions } = data
  const contribMap = Object.fromEntries(contributions.map((c: Contribution) => [c.member_id, c]))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="font-bold text-green-600 text-lg">AjoPot</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="capitalize">{group.frequency}</span>
            <span>·</span>
            <span>{formatKobo(group.contribution_amount)} per cycle</span>
            <span>·</span>
            <span>Cycle #{group.current_cycle}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Member Status — Cycle #{group.current_cycle}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-400 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Paid On</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m: GroupMember) => {
                  const contrib = contribMap[m.id]
                  const status: ContributionStatus = contrib?.status ?? 'pending'
                  
                  // Simple phone masking for public view
                  const maskedPhone = m.phone && m.phone.length > 8 
                    ? m.phone.replace(/(\+\d{3})(\d{4})(\d+)/, '$1****$3') 
                    : m.phone || 'N/A'

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-xs font-bold text-green-700 border border-green-100">
                          #{m.payout_position}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {m.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs tracking-wider whitespace-nowrap">
                        {maskedPhone}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {contrib?.paid_at ? formatDate(contrib.paid_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">Powered by AjoPot · ajopot.ng</p>
      </div>
    </div>
  )
}


export default GroupPublicView;
