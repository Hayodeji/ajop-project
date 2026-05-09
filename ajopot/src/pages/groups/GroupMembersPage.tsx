import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMembers, useRemoveMember } from '@/hooks/useMembers'
import { useGroup } from '@/hooks/useGroups'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import InviteMemberModal from '@/components/modals/InviteMemberModal'
import EditMemberModal from '@/components/modals/EditMemberModal'

const GroupMembersPage = () => {
  const { id } = useParams<{ id: string }>()
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: group, isLoading: groupLoading } = useGroup(id!)
  const { data: members, isLoading: membersLoading } = useMembers(id!)
  const removeMember = useRemoveMember(id!)
  
  const [editingMember, setEditingMember] = useState<any>(null)

  if (groupLoading || membersLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!group) return <div className="text-center py-20 text-gray-500">Group not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/groups/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← Back to {group.name}</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Manage Members</h1>
        </div>
        <Button onClick={() => openModal('invite-member')}>+ Add Member</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members?.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                      {m.payout_position}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => { setEditingMember(m); openModal('edit-member') }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { if(confirm('Remove this member?')) removeMember.mutate(m.id) }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                    No members yet. Click "+ Add Member" to invite someone.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <InviteMemberModal
        open={activeModal === 'invite-member'}
        onClose={closeModal}
        groupId={id!}
        memberCount={members?.length ?? 0}
      />

      {editingMember && (
        <EditMemberModal
          open={activeModal === 'edit-member'}
          onClose={() => { closeModal(); setEditingMember(null) }}
          groupId={id!}
          member={editingMember}
        />
      )}
    </div>
  )
}

export default GroupMembersPage;
