import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers, useRemoveMember } from '@/hooks/useMembers'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import RotationSchedule from '@/components/groups/RotationSchedule'
import InviteMemberModal from '@/components/modals/InviteMemberModal'
import EditMemberModal from '@/components/modals/EditMemberModal'
import { Group } from '@/types'

interface Props {
  group: Group
}

export const MembersTab = ({ group }: Props) => {
  const { id } = group
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: members, isLoading: membersLoading } = useMembers(id)
  const removeMember = useRemoveMember(id)
  const [editingMember, setEditingMember] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        <div className="flex gap-2">
          <Link to={`/groups/${id}/members`}>
            <Button size="sm" variant="secondary">Manage List</Button>
          </Link>
          <Button size="sm" onClick={() => openModal('invite-member')}>+ Add Member</Button>
        </div>
      </div>
      
      <RotationSchedule schedule={group.rotation_schedule || []} currentCycle={group.current_cycle} />
      
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
                <div className="flex gap-4">
                  <button
                    onClick={() => { setEditingMember(m); openModal('edit-member') }}
                    className="text-xs text-green-600 hover:text-green-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeMember.mutate(m.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <InviteMemberModal
        open={activeModal === 'invite-member'}
        onClose={closeModal}
        groupId={id}
        memberCount={members?.length ?? 0}
      />

      {editingMember && (
        <EditMemberModal
          open={activeModal === 'edit-member'}
          onClose={() => { closeModal(); setEditingMember(null) }}
          groupId={id}
          member={editingMember}
        />
      )}
    </div>
  )
}
