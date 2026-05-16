import { useContributions, useMarkContribution } from '@/hooks/useContributions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import CycleCalendar from '@/components/groups/CycleCalendar'
import { Group, ContributionStatus } from '@/types'

interface Props {
  group: Group
}

const STATUS_TONE: Record<ContributionStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  late: 'danger',
}

export const ContributionsTab = ({ group }: Props) => {
  const { id } = group
  const { data: contributions, isLoading: contribLoading } = useContributions(id)
  const markContribution = useMarkContribution(id)

  return (
    <div className="space-y-6">
      <CycleCalendar contributions={contributions || []} currentCycle={group.current_cycle} />
      
      {contribLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">All Contributions</h3>
          {contributions?.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No contributions recorded</p>
          )}
          {contributions?.map((c) => {
            const memberInfo = (c as any).group_members
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{memberInfo?.name ?? 'Unknown'}</div>
                    <div className="text-sm text-gray-500">
                      Cycle #{c.cycle_number} · {c.paid_at ? formatDate(c.paid_at) : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    {c.status !== 'paid' && (
                      <button
                        onClick={() =>
                          markContribution.mutate({
                            memberId: c.member_id,
                            cycleNumber: c.cycle_number,
                            status: 'paid',
                          })
                        }
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
