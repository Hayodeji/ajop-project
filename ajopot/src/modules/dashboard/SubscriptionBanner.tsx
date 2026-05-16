import { Link } from 'react-router-dom'
import { Subscription } from '@/types'

interface Props {
  sub: Subscription | null
}

export const SubscriptionBanner = ({ sub }: Props) => {
  if (!sub) return null
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-green-700 font-medium capitalize">
        {sub.plan} plan · {sub.status}
      </span>
      <Link to="/profile" className="text-xs text-green-600 underline">
        Manage
      </Link>
    </div>
  )
}
