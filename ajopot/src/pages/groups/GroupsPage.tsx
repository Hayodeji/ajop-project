import { Link } from 'react-router-dom'
import { useGroups } from '@/hooks/useGroups'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'
import CreateGroupModal from '@/components/modals/CreateGroupModal'

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups()
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your ajo groups</p>
        </div>
        <Button onClick={() => openModal('create-group')}>+ New Group</Button>
      </div>

      {!groups?.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🫙</div>
          <h3 className="text-lg font-semibold text-gray-700">No groups yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Create your first ajo group to get started</p>
          <Button onClick={() => openModal('create-group')}>Create Group</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize ml-2 shrink-0">
                      {group.frequency}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{formatKobo(group.contribution_amount)}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">
                      Members
                      <div className="font-semibold text-gray-800">{group.member_count}</div>
                    </div>
                    <div className="text-gray-500">
                      Current cycle
                      <div className="font-semibold text-gray-800">#{group.current_cycle}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(group.created_at)}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateGroupModal open={activeModal === 'create-group'} onClose={closeModal} />
    </div>
  )
}
