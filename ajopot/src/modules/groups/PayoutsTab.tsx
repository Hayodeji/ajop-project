import { usePayouts } from '@/hooks/usePayouts'
import { useMembers } from '@/hooks/useMembers'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openModal('record-payout')}>+ Record Payout</Button>
      </div>
      {payoutsLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {payouts?.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No payouts recorded</p>
          )}
          {payouts?.map((p) => {
            const memberInfo = p.member
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{memberInfo?.name ?? 'Unknown'}</div>
                    <div className="text-sm text-gray-500">
                      Cycle #{p.cycle_number} · {formatDate(p.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatKobo(p.amount)}</div>
                    {p.receipt_url && (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        Receipt
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
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
