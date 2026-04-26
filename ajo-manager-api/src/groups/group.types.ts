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
