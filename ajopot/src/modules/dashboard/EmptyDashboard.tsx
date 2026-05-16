import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const EmptyDashboard = () => {
  return (
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
  )
}
