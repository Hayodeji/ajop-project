import { usePayouts } from '@/hooks/usePayouts'
import { useMembers } from '@/hooks/useMembers'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'
import RecordPayoutModal from '@/components/modals/RecordPayoutModal'
import { Group } from '@/types'

interface Props {
  group: Group
}

export const PayoutsTab = ({ group }: Props) => {
  const { id } = group
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: payouts, isLoading: payoutsLoading } = usePayouts(id)
  const { data: members } = useMembers(id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Payout History</h2>
          <p className="text-sm text-gray-500 mt-1">Track funds disbursed to members.</p>
        </div>
        <Button size="sm" onClick={() => openModal('record-payout')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-transform hover:-translate-y-0.5">
          + Record Payout
        </Button>
      </div>
      
      {payoutsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {payouts?.length === 0 && (
            <div className="p-12 text-center">
              <span className="text-4xl mb-4 block">💰</span>
              <p className="text-gray-500 font-medium">No payouts recorded yet.</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {payouts?.map((p) => {
              const memberInfo = p.member
              return (
                <div key={p.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-emerald-100 items-center justify-center text-emerald-600">
                      ↗️
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg tracking-tight mb-1">{memberInfo?.name ?? 'Unknown'}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold text-xs">Cycle #{p.cycle_number}</span>
                        <span>•</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600 text-xl tracking-tight">{formatKobo(p.amount)}</div>
                    </div>
                    {p.receipt_url && (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        📄 Receipt
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <RecordPayoutModal
        open={activeModal === 'record-payout'}
        onClose={closeModal}
        groupId={id}
        members={members ?? []}
        currentCycle={group.current_cycle}
      />
    </div>
  )
}
