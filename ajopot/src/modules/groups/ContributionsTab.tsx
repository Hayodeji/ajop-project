import { useContributions, useMarkContribution } from '@/hooks/useContributions'
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
    <div className="space-y-8">
      <CycleCalendar contributions={contributions || []} currentCycle={group.current_cycle} />
      
      {contribLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Contribution History</h3>
            <p className="text-sm text-gray-500 mt-1">Track payments across all cycles.</p>
          </div>
          
          {contributions?.length === 0 && (
            <div className="p-12 text-center">
              <span className="text-4xl mb-4 block">💸</span>
              <p className="text-gray-500 font-medium">No contributions recorded yet.</p>
            </div>
          )}
          
          <div className="divide-y divide-gray-100">
            {contributions?.map((c) => {
              const memberInfo = c.member
              return (
                <div key={c.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 items-center justify-center text-gray-400">
                      💳
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg tracking-tight mb-1">{memberInfo?.name ?? 'Unknown'}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold text-xs">Cycle #{c.cycle_number}</span>
                        <span>•</span>
                        <span>{c.paid_at ? `Paid on ${formatDate(c.paid_at)}` : 'Awaiting payment'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <Badge tone={STATUS_TONE[c.status.toLowerCase() as ContributionStatus]} className="px-3 py-1 text-xs uppercase tracking-wider font-bold">{c.status}</Badge>
                    {c.status.toLowerCase() !== 'paid' && (
                      <button
                        onClick={() =>
                          markContribution.mutate({
                            memberId: c.member_id,
                            cycleNumber: c.cycle_number,
                            status: 'paid',
                          })
                        }
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all duration-300"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
