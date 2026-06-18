import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers, useRemoveMember } from '@/hooks/useMembers'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Active Members</h2>
          <p className="text-sm text-gray-500 mt-1">Manage people and their rotation order.</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/groups/${id}/members`}>
            <Button size="sm" variant="secondary" className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium shadow-sm">
              Manage List
            </Button>
          </Link>
          <Button size="sm" onClick={() => openModal('invite-member')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-transform hover:-translate-y-0.5">
            + Add Member
          </Button>
        </div>
      </div>
      
      <RotationSchedule schedule={group.rotation_schedule || []} currentCycle={group.current_cycle} />
      
      {membersLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members?.length === 0 && (
            <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-gray-500 font-medium">No members added yet.</p>
            </div>
          )}
          {members?.map((m) => (
            <div key={m.id} className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full flex items-center justify-center font-bold text-emerald-700 text-lg shadow-inner ring-1 ring-emerald-200/50">
                    {m.payout_position}
                  </div>
                  <div>
                    <Link to={`/groups/${id}/members/${m.id}`} className="block hover:opacity-80 transition-opacity">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-lg tracking-tight">{m.name}</div>
                      <div className="text-sm text-gray-500 font-medium">{m.phone}</div>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingMember(m); openModal('edit-member') }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { if(window.confirm('Remove this member?')) removeMember.mutate(m.id) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
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
