import { useNavigate } from 'react-router-dom'
import { useSubscription, useSelectPlan } from '@/hooks/useSubscription'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { SubscriptionPlan } from '@/types'
import { STATUS_TONE } from '@/lib/constants'

export const SubscriptionSettings = () => {
  const navigate = useNavigate()
  const { data: sub } = useSubscription()
  const { mutate: changePlan, isPending: planChanging } = useSelectPlan()

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Current Subscription</h2>
          {sub && (
            <Badge tone={STATUS_TONE[sub.status] || 'neutral'}>
              {sub.status.toUpperCase()}
            </Badge>
          )}
        </div>

        {!sub ? (
          <div className="text-center py-6">
            <p className="text-slate-500 mb-4">No active subscription.</p>
            <Button onClick={() => navigate('/plan-select')}>Choose a Plan</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl">
                {sub.plan === 'pro' ? '💎' : sub.plan === 'smart' ? '🚀' : '✅'}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 capitalize">{sub.plan} Plan</p>
                {sub.trial_ends_at && sub.status === 'trial' && (
                  <p className="text-sm text-slate-500">Free trial ends on {formatDate(sub.trial_ends_at)}</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Included Features</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sub.plan.toLowerCase() === 'basic' && (
                  <>
                    <li className="text-sm text-slate-700 flex items-center gap-2">✅ 1 Group limit</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">✅ Up to 15 members</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">✅ Basic tracking</li>
                  </>
                )}
                {sub.plan.toLowerCase() === 'smart' && (
                  <>
                    <li className="text-sm text-slate-700 flex items-center gap-2">🚀 Up to 5 Groups</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">🚀 Unlimited members</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">🚀 Auto WhatsApp reminders</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">🚀 PDF Receipts</li>
                  </>
                )}
                {sub.plan.toLowerCase() === 'pro' && (
                  <>
                    <li className="text-sm text-slate-700 flex items-center gap-2">💎 Unlimited Groups</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">💎 Public Dashboards</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">💎 Full history</li>
                    <li className="text-sm text-slate-700 flex items-center gap-2">💎 Priority support</li>
                  </>
                )}
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-900 mb-4">Switch Plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['basic', 'smart', 'pro'] as SubscriptionPlan[]).map((plan) => (
                  <button
                    key={plan}
                    disabled={sub.plan.toLowerCase() === plan || planChanging}
                    onClick={() => changePlan(plan)}
                    className={`px-4 py-4 rounded-xl text-sm border-2 transition-all flex flex-col items-center justify-center gap-1 ${sub.plan.toLowerCase() === plan
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-4 ring-brand-50'
                        : 'border-slate-100 hover:border-brand-200 text-slate-600 bg-white'
                      }`}
                  >
                    <span className="font-bold uppercase tracking-wide">{plan}</span>
                    <span className="text-xs opacity-70">
                      {plan === 'basic' ? '₦1,500' : plan === 'smart' ? '₦3,000' : '₦5,000'}/mo
                    </span>
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
