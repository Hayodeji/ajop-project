import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGroup } from '@/hooks/useGroups'
import { useMembers, useRemoveMember } from '@/hooks/useMembers'
import { useContributions, useMarkContribution } from '@/hooks/useContributions'
import { usePayouts } from '@/hooks/usePayouts'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'
import InviteMemberModal from '@/components/modals/InviteMemberModal'
import RecordPayoutModal from '@/components/modals/RecordPayoutModal'
import { ContributionStatus } from '@/types'

type Tab = 'members' | 'contributions' | 'payouts'

const STATUS_TONE: Record<ContributionStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  late: 'danger',
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('members')
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: group, isLoading: groupLoading } = useGroup(id!)
  const { data: members, isLoading: membersLoading } = useMembers(id!)
  const { data: contributions, isLoading: contribLoading } = useContributions(id!)
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(id!)

  const removeMember = useRemoveMember(id!)
  const markContribution = useMarkContribution(id!)

  if (groupLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!group) return <div className="text-center py-20 text-gray-500">Group not found</div>

  const publicUrl = `${window.location.origin}/g/${group.public_token}`

  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="text-sm text-gray-500 hover:text-gray-700">← Groups</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {group.frequency} · {formatKobo(group.contribution_amount)} · Cycle #{group.current_cycle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { navigator.clipboard.writeText(publicUrl) }}
            >
              Copy member link
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['members', 'contributions', 'payouts'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openModal('invite-member')}>+ Add Member</Button>
          </div>
          {membersLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {members?.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">No members yet</p>
              )}
              {members?.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center font-semibold text-green-700 text-sm">
                        {m.payout_position}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{m.name}</div>
                        <div className="text-sm text-gray-500">{m.phone}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMember.mutate(m.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <InviteMemberModal
            open={activeModal === 'invite-member'}
            onClose={closeModal}
            groupId={id!}
            memberCount={members?.length ?? 0}
          />
        </div>
      )}

      {/* Contributions tab */}
      {tab === 'contributions' && (
        <div className="space-y-2">
          {contribLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <>
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
      )}

      {/* Payouts tab */}
      {tab === 'payouts' && (
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
                const memberInfo = (p as any).group_members
                return (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{memberInfo?.name ?? 'Unknown'}</div>
                        <div className="text-sm text-gray-500">
                          Cycle #{p.cycle_number} · {formatDate(p.paid_out_at)}
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
            groupId={id!}
            members={members ?? []}
            currentCycle={group.current_cycle}
          />
        </div>
      )}
    </div>
  )
}
