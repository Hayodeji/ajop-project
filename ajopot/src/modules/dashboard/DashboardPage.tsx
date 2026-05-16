import { useGroups } from '@/hooks/useGroups'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { DashboardSummary } from './DashboardSummary'
import { SubscriptionBanner } from './SubscriptionBanner'
import { EmptyDashboard } from './EmptyDashboard'

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user)
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { data: sub, isLoading: subLoading } = useSubscription()

  if (groupsLoading || subLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.phone ?? 'Welcome back'}</p>
      </div>

      <SubscriptionBanner sub={sub ?? null} />

      {groups && groups.length > 0 ? (
        <DashboardSummary groups={groups} />
      ) : (
        <EmptyDashboard />
      )}
    </div>
  )
}

export default DashboardPage
