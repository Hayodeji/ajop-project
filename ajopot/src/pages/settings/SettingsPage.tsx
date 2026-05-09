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

const SettingsPage = () => {
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

            <div className="bg-gray-50 rounded-lg p-4 mt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Access & Features</p>
              <ul className="space-y-2">
                {sub.plan.toLowerCase() === 'basic' && (
                  <>
                    <li className="text-sm text-gray-700 flex items-center gap-2">✅ 1 Group limit</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">✅ Up to 15 members</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">✅ Basic contribution tracking</li>
                  </>
                )}
                {sub.plan.toLowerCase() === 'smart' && (
                  <>
                    <li className="text-sm text-gray-700 flex items-center gap-2">🚀 Up to 5 Groups</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">🚀 Unlimited members</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">🚀 Auto WhatsApp reminders</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">🚀 PDF Receipts generation</li>
                  </>
                )}
                {sub.plan.toLowerCase() === 'pro' && (
                  <>
                    <li className="text-sm text-gray-700 flex items-center gap-2">💎 Unlimited Groups & Members</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">💎 Public Member Dashboards</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">💎 Full contribution history</li>
                    <li className="text-sm text-gray-700 flex items-center gap-2">💎 Priority support</li>
                  </>
                )}
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Change plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['basic', 'smart', 'pro'] as SubscriptionPlan[]).map((plan) => (
                  <button
                    key={plan}
                    disabled={sub.plan.toLowerCase() === plan || isPending}
                    onClick={() => changePlan(plan)}
                    className={`px-3 py-3 rounded-xl text-sm border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      sub.plan.toLowerCase() === plan
                        ? 'border-green-600 bg-green-50 text-green-700 ring-2 ring-green-100'
                        : 'border-gray-200 hover:border-green-400 text-gray-700 bg-white'
                    }`}
                  >
                    <span className="font-bold">{plan.toUpperCase()}</span>
                    <span className="text-xs opacity-70">
                      {plan === 'basic' ? '₦1,500' : plan === 'smart' ? '₦3,000' : '₦5,000'}/mo
                    </span>
                    {sub.plan.toLowerCase() === plan && (
                      <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full mt-1">
                        CURRENT
                      </span>
                    )}
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


export default SettingsPage;
