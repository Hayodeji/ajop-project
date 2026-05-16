import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGroup } from '@/hooks/useGroups'
import { useUiStore } from '@/stores/uiStore'
import { Spinner } from '@/components/ui/Spinner'
import { GroupHeader } from './GroupHeader'
import { MembersTab } from './MembersTab'
import { ContributionsTab } from './ContributionsTab'
import { PayoutsTab } from './PayoutsTab'
import EditGroupModal from '@/components/modals/EditGroupModal'

type Tab = 'members' | 'contributions' | 'payouts'

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('members')
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  const { data: group, isLoading: groupLoading } = useGroup(id!)

  if (groupLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!group) return <div className="text-center py-20 text-gray-500">Group not found</div>

  return (
    <div className="space-y-6">
      <GroupHeader group={group} />

      <EditGroupModal
        open={activeModal === 'edit-group'}
        onClose={closeModal}
        group={group}
      />

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

      <div className="mt-6">
        {tab === 'members' && <MembersTab group={group} />}
        {tab === 'contributions' && <ContributionsTab group={group} />}
        {tab === 'payouts' && <PayoutsTab group={group} />}
      </div>
    </div>
  )
}

export default GroupDetailPage
