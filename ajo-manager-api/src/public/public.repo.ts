import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class PublicRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async findGroupByToken(token: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id, name, contribution_amount, frequency, member_count, current_cycle, public_token, created_at')
      .eq('public_token', token)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findMembersByGroup(groupId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('id, name, phone, payout_position, is_active, joined_at, group_id')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('payout_position')

    if (error) throw error
    return data || []
  }

  async findContributionsByGroup(groupId: string, cycleNumber: number) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('*')
      .eq('group_id', groupId)
      .eq('cycle_number', cycleNumber)

    if (error) throw error
    return data || []
  }
}
