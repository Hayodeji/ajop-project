import { Link } from 'react-router-dom'
import { useGroups } from '@/hooks/useGroups'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo } from '@/lib/utils'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: groups, isLoading } = useGroups()
  const { data: sub } = useSubscription()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.phone ?? 'Welcome back'}</p>
      </div>

      {sub && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-green-700 font-medium capitalize">
            {sub.plan} plan · {sub.status}
          </span>
          <Link to="/settings" className="text-xs text-green-600 underline">
            Manage
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="text-sm text-gray-500">Groups</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{groups?.length ?? 0}</div>
            <Link to="/groups" className="text-xs text-green-600 mt-2 inline-block">
              View all →
            </Link>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-gray-500">Active members</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {groups?.reduce((sum, g) => sum + g.member_count, 0) ?? 0}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-gray-500">Total contributions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatKobo(groups?.reduce((sum, g) => sum + g.contribution_amount, 0) ?? 0)}
            </div>
          </Card>
        </div>
      )}

      {!groups?.length && !isLoading && (
        <Card className="p-6">
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🫙</div>
            <h3 className="font-semibold text-gray-700">Create your first group</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Start managing your ajo contributions today
            </p>
            <Link to="/groups">
              <Button>Get Started</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
