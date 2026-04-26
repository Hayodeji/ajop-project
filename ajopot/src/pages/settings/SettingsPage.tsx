import { useSubscription, useSelectPlan } from '@/hooks/useSubscription'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { SubscriptionPlan } from '@/types'

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  basic: 'Basic — ₦1,500/mo',
  smart: 'Smart — ₦3,000/mo',
  pro: 'Pro — ₦5,000/mo',
}

export default function SettingsPage() {
  const { data: sub, isLoading } = useSubscription()
  const { mutate: changePlan, isPending, variables } = useSelectPlan()

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Subscription</h2>
        {!sub ? (
          <p className="text-gray-500 text-sm">
            No active subscription.{' '}
            <a href="/plan-select" className="text-green-600 underline">
              Choose a plan
            </a>
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-medium capitalize text-gray-900">{sub.plan} plan</span>
              <Badge
                tone={
                  sub.status === 'active'
                    ? 'success'
                    : sub.status === 'trial'
                    ? 'info'
                    : 'warning'
                }
              >
                {sub.status}
              </Badge>
            </div>
            {sub.trial_ends_at && sub.status === 'trial' && (
              <p className="text-sm text-gray-500">Trial ends {formatDate(sub.trial_ends_at)}</p>
            )}

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Change plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['basic', 'smart', 'pro'] as SubscriptionPlan[]).map((plan) => (
                  <button
                    key={plan}
                    disabled={sub.plan === plan || isPending}
                    onClick={() => changePlan(plan)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      sub.plan === plan
                        ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                        : 'border-gray-200 hover:border-green-300 text-gray-700'
                    }`}
                  >
                    {isPending && variables === plan ? 'Switching...' : PLAN_LABELS[plan]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
