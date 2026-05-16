import { SubscriptionPlan } from '@/types'

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  basic: 'Basic — ₦1,500/mo',
  smart: 'Smart — ₦3,000/mo',
  pro: 'Pro — ₦5,000/mo',
}

export const FAQS = [
  {
    q: 'How does the free trial work?',
    a: 'Every new admin starts with a 7-day free trial of the Smart plan. You can explore all features, add members, and manage groups. On day 7, your card will be automatically charged for the plan you selected during signup.',
  },
  {
    q: 'What happens if a member is late?',
    a: 'AjoPot marks contributions as late automatically if they are not paid by the due date. For Smart and Pro plans, we send automated WhatsApp reminders to late members.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time from this page. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes, we use industry-standard encryption and security practices. Your payment information is handled securely by Paystack, and we never store your full card details.',
  },
  {
    q: 'How many groups can I manage?',
    a: 'Basic plan supports 1 group, Smart plan supports up to 5 groups, and the Pro plan allows you to manage unlimited groups.',
  },
]

export const PLAN_TONE: Record<string, any> = { basic: 'neutral', smart: 'info', pro: 'brand' }
export const STATUS_TONE: Record<string, any> = { active: 'success', trial: 'warning', cancelled: 'danger', expired: 'danger' }
