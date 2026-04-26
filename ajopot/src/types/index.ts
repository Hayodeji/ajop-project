export type ContributionStatus = 'paid' | 'pending' | 'late'
export type GroupFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface Group {
  id: string
  admin_id: string
  name: string
  contribution_amount: number
  frequency: GroupFrequency
  member_count: number
  current_cycle: number
  public_token: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  name: string
  phone: string
  payout_position: number
  is_active: boolean
  joined_at: string
}

export interface Contribution {
  id: string
  group_id: string
  member_id: string
  cycle_number: number
  status: ContributionStatus
  paid_at: string | null
  marked_by: string
}

export interface Payout {
  id: string
  group_id: string
  member_id: string
  cycle_number: number
  amount: number
  paid_out_at: string
  receipt_url: string | null
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
  error?: null
}

export interface ApiError {
  data?: null
  error: {
    message: string
    code?: string
  }
}

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

export interface Profile {
  id: string
  user_id: string
  name: string
  phone: string
  plan: SubscriptionPlan
  is_pro: boolean
  referral_code: string
  created_at: string
}
