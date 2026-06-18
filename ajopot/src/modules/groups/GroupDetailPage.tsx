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

  if (groupLoading) return <div className="flex flex-col justify-center items-center py-32"><Spinner size="xl" /><p className="mt-4 text-gray-500 font-medium animate-pulse">Loading group details...</p></div>
  if (!group) return <div className="text-center py-32 text-gray-500 text-lg">Group not found or you don't have access.</div>

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GroupHeader group={group} />

      <EditGroupModal
        open={activeModal === 'edit-group'}
        onClose={closeModal}
        group={group}
      />

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex overflow-x-auto gap-2 no-scrollbar">
        {(['members', 'contributions', 'payouts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
              tab === t
                ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="transition-all duration-300 relative">
        {tab === 'members' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><MembersTab group={group} /></div>}
        {tab === 'contributions' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><ContributionsTab group={group} /></div>}
        {tab === 'payouts' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><PayoutsTab group={group} /></div>}
      </div>
    </div>
  )
}

export default GroupDetailPage
