import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { initiatePayment } from '@/lib/api'
import { SubscriptionPlan } from '@/types'

const PLANS: {
  plan: SubscriptionPlan
  name: string
  price: string
  priceLabel: string
  groups: string
  members: string
  features: string[]
  highlight?: boolean
}[] = [
  {
    plan: 'basic',
    name: 'Basic',
    price: '₦1,500',
    priceLabel: '₦1,500/month',
    groups: '1 group',
    members: 'Up to 15 members',
    features: [
      'Contribution tracking',
      'Rotation schedule',
      'Basic payout recording',
      'Member dashboard',
    ],
  },
  {
    plan: 'smart',
    name: 'Smart',
    price: '₦3,000',
    priceLabel: '₦3,000/month',
    groups: 'Up to 5 groups',
    members: 'Unlimited members',
    features: [
      'Everything in Basic',
      'Auto WhatsApp reminders',
      'Payout receipts (PDF)',
      'Timestamped records',
    ],
    highlight: true,
  },
  {
    plan: 'pro',
    name: 'Pro',
    price: '₦5,000',
    priceLabel: '₦5,000/month',
    groups: 'Unlimited groups',
    members: 'Unlimited members',
    features: [
      'Everything in Smart',
      'Full contribution history',
      'Priority support',
      'Member dashboard (public)',
    ],
  },
]

export default function PlanSelectPage() {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null)

  const handleSelect = async (plan: SubscriptionPlan) => {
    setLoading(plan)
    try {
      const { authorization_url } = await initiatePayment(plan)
      window.location.href = authorization_url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start payment. Try again.'
      toast.error(msg)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            FOUNDING MEMBER OFFER — 50% off your first month on any plan
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Choose the plan that works for your group
          </h1>
          <p className="text-gray-500 mt-2">
            Secure payment via Paystack · Cancel anytime
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.plan}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
                p.highlight ? 'border-green-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {p.highlight && (
                <div className="text-center mb-4">
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {p.price}
                  <span className="text-base font-normal text-gray-500">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {p.groups} · {p.members}
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Button
                fullWidth
                variant={p.highlight ? 'primary' : 'secondary'}
                loading={loading === p.plan}
                disabled={loading !== null && loading !== p.plan}
                onClick={() => handleSelect(p.plan)}
              >
                Subscribe — {p.price}/mo
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Payments are processed securely by Paystack. You will be billed monthly.
        </p>
      </div>
    </div>
  )
}
