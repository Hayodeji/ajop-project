import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { formatKobo } from '@/lib/utils'
import { Group } from '@/types'

interface Props {
  groups: Group[]
}

export const DashboardSummary = ({ groups }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="text-sm text-gray-500">Groups</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{groups.length}</div>
        <Link to="/groups" className="text-xs text-green-600 mt-2 inline-block">
          View all →
        </Link>
      </Card>
      <Card className="p-5">
        <div className="text-sm text-gray-500">Active members</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">
          {groups.reduce((sum, g) => sum + g.member_count, 0)}
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-sm text-gray-500">Total contributions</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">
          {formatKobo(groups.reduce((sum, g) => sum + g.contribution_amount, 0))}
        </div>
      </Card>
    </div>
  )
}
