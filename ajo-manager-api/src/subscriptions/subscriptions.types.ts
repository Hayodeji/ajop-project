export type SubscriptionPlan = 'basic' | 'smart' | 'pro'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

export const PLAN_GROUP_LIMITS: Record<SubscriptionPlan, number> = {
  basic: 1,
  smart: 5,
  pro: Infinity,
}

export const PLAN_MEMBER_LIMITS: Record<SubscriptionPlan, number> = {
  basic: 15,
  smart: Infinity,
  pro: Infinity,
}
