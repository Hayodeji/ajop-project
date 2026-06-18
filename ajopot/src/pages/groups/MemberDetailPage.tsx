import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMember } from '@/hooks/useMembers'
import { useContributions } from '@/hooks/useContributions'
import { useGroup } from '@/hooks/useGroups'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatKobo, formatDate } from '@/lib/utils'
import { ContributionStatus } from '@/types'
import EditMemberModal from '@/components/modals/EditMemberModal'
import { useUiStore } from '@/stores/uiStore'
import { useRemoveMember } from '@/hooks/useMembers'

const STATUS_TONE: Record<ContributionStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  late: 'danger',
}

const STATUS_ICON: Record<ContributionStatus, string> = {
  paid: '✅',
  pending: '⏳',
  late: '🔴',
}

const MemberDetailPage = () => {
  const { id: groupId, memberId } = useParams<{ id: string; memberId: string }>()
  const navigate = useNavigate()
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: group } = useGroup(groupId!)
  const { data: member, isLoading: memberLoading } = useMember(memberId!)
  const { data: contributions, isLoading: contribLoading } = useContributions(groupId!)
  const removeMember = useRemoveMember(groupId!)

  const memberContributions = contributions?.filter((c) => c.member_id === memberId) ?? []
  const paidCount = memberContributions.filter((c) => c.status === 'paid').length
  const lateCount = memberContributions.filter((c) => c.status === 'late').length
  const pendingCount = memberContributions.filter((c) => c.status === 'pending').length
  const totalPaid = paidCount * (group?.contribution_amount ?? 0)

  if (memberLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!member) {
    return <div className="text-center py-20 text-gray-500">Member not found</div>
  }

  const handleRemove = () => {
    if (!confirm(`Remove ${member.name} from this group?`)) return
    removeMember.mutate(member.id, {
      onSuccess: () => navigate(`/groups/${groupId}/members`),
    })
  }

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/groups" className="hover:text-gray-700">Groups</Link>
        <span>›</span>
        <Link to={`/groups/${groupId}`} className="hover:text-gray-700">{group?.name ?? '...'}</Link>
        <span>›</span>
        <Link to={`/groups/${groupId}/members`} className="hover:text-gray-700">Members</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{member.name}</span>
      </nav>

      {/* Member Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-gray-500 mt-0.5">{member.phone}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {member.is_active ? '● Active' : '○ Inactive'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  Position #{member.payout_position}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal('edit-member')}
            >
              ✏️ Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={removeMember.isPending}
              onClick={handleRemove}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{lateCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Late</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatKobo(totalPaid)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total paid</div>
          </div>
        </div>
      </Card>

      {/* Member Info Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Personal Info */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-400">Full Name</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{member.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Phone Number</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{member.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Payout Position</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">#{member.payout_position}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Joined</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(member.joined_at)}</dd>
            </div>
          </dl>
        </Card>

        {/* Bank Info */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Bank Details</h2>
          {member.bank_name ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400">Bank</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{member.bank_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Account Number</dt>
                <dd className="text-sm font-mono font-medium text-gray-900 mt-0.5 tracking-widest">
                  {member.account_number}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Account Name</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{member.account_name}</dd>
              </div>
            </dl>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-gray-400 text-sm">No bank details added</p>
              <button
                onClick={() => openModal('edit-member')}
                className="text-green-600 text-xs mt-1 hover:underline"
              >
                + Add bank details
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Contribution History */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Contribution History</h2>
          <span className="text-xs text-gray-400">{memberContributions.length} records</span>
        </div>
        {contribLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : memberContributions.length === 0 ? (
          <div className="py-10 text-center text-gray-400 italic text-sm">No contribution records yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...memberContributions]
              .sort((a, b) => b.cycle_number - a.cycle_number)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{STATUS_ICON[c.status]}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cycle #{c.cycle_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.due_date ? `Due: ${formatDate(c.due_date)}` : 'No due date set'}
                        {c.paid_at ? ` · Paid: ${formatDate(c.paid_at)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {formatKobo(group?.contribution_amount ?? 0)}
                    </span>
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {member && (
        <EditMemberModal
          open={activeModal === 'edit-member'}
          onClose={closeModal}
          groupId={groupId!}
          member={member}
        />
      )}
    </div>
  )
}

export default MemberDetailPage
