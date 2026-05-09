import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicGroup } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'
import { ContributionStatus } from '@/types'

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
  const contribMap = Object.fromEntries(contributions.map((c) => [c.member_id, c]))

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

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Member Status — Cycle #{group.current_cycle}
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const contrib = contribMap[m.id]
              const status: ContributionStatus = contrib?.status ?? 'pending'
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                      {m.payout_position}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {m.name} <span className="text-gray-400 font-normal">({m.phone || 'N/A'})</span>
                      </div>
                      {contrib?.paid_at && (
                        <div className="text-xs text-gray-400">{formatDate(contrib.paid_at)}</div>
                      )}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">Powered by AjoPot · ajopot.ng</p>
      </div>
    </div>
  )
}


export default GroupPublicView;
