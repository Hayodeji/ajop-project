import { SubscriptionPlan } from '@/types'

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  basic: 'Basic — ₦1,500/mo',
  smart: 'Smart — ₦3,000/mo',
  pro: 'Pro — ₦5,000/mo',
}

export const FAQS = [
  {
    q: 'How does the free trial work?',
    a: 'Every new admin starts with a 14-day free trial of the Smart plan. You can explore all features, add members, and manage groups. After your trial ends, you will be charged for the plan you selected during signup.',
  },
  {
    q: 'What happens if a member is late?',
    a: 'AjoPot automatically marks contributions as late if they are not paid by the due date. On the Smart and Pro plans, automated WhatsApp reminders are sent to late members to prompt payment.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time from this page. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle. Note that plan changes are locked while a trial or active billing period is in progress.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes, we use industry-standard encryption and security practices. Your payment information is handled securely by Paystack, and we never store your full card details.',
  },
  {
    q: 'How many groups and members can I manage?',
    a: 'Basic supports 1 group with up to 15 members. Smart supports up to 5 groups with unlimited members. Pro supports unlimited groups and unlimited members.',
  },
]

export const PLAN_TONE: Record<string, any> = { basic: 'neutral', smart: 'info', pro: 'brand' }
export const STATUS_TONE: Record<string, any> = {
  active: 'success',
  trialing: 'warning',
  trial: 'warning',       // legacy compat
  payment_failed: 'danger',
  cancelled: 'danger',
  expired: 'danger',
}
