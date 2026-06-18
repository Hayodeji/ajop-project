import { Link } from 'react-router-dom'
import { useGroups } from '@/hooks/useGroups'
import { useUiStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo } from '@/lib/utils'
import CreateGroupModal from '@/components/modals/CreateGroupModal'

const GroupsPage = () => {
  const { data: groups, isLoading } = useGroups()
  const openModal = useUiStore((s) => s.openModal)
  const activeModal = useUiStore((s) => s.activeModal)
  const closeModal = useUiStore((s) => s.closeModal)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm animate-pulse">Loading your groups…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Groups</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage your Ajo contribution circles</p>
        </div>
        <Button
          onClick={() => openModal('create-group')}
          className="bg-green-600 text-white hover:bg-green-700 font-semibold px-5 shadow-sm"
        >
          + Create New Group
        </Button>
      </div>

      {!groups?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🏦
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No groups created yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            Start your first Ajo group to begin managing contributions and automated payouts seamlessly.
          </p>
          <Button
            onClick={() => openModal('create-group')}
            className="bg-green-600 hover:bg-green-700 shadow-sm px-8"
          >
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => {
            const totalPot = group.contribution_amount * group.member_count
            return (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="group relative block bg-white rounded-2xl border border-gray-100 p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 rounded-full group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="pr-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md capitalize tracking-wide">
                          {group.frequency}
                        </span>
                        <span className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-md tracking-wide">
                          Cycle #{group.current_cycle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Pot Value</p>
                    <p className="text-3xl font-extrabold text-gray-900">{formatKobo(totalPot)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Members</p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {/* Fake avatar pile based on member count */}
                          {Array.from({ length: Math.min(3, group.member_count) }).map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-green-100 flex items-center justify-center">
                              <span className="text-[10px] text-green-700">👤</span>
                            </div>
                          ))}
                          {group.member_count > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                              +{group.member_count - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{group.member_count}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Per Cycle</p>
                      <p className="text-sm font-bold text-gray-800">{formatKobo(group.contribution_amount)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <CreateGroupModal open={activeModal === 'create-group'} onClose={closeModal} />
    </div>
  )
}

export default GroupsPage
