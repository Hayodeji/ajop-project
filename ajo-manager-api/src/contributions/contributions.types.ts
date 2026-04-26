export type ContributionStatus = 'pending' | 'paid' | 'late'

export interface Contribution {
  id: string
  group_id: string
  member_id: string
  cycle_number: number
  status: ContributionStatus
  paid_at: string | null
  marked_by: string | null
  created_at: string
}
