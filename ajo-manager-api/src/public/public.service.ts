import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class PublicService {
  constructor(private readonly supabase: SupabaseService) {}

  async getGroupByToken(token: string) {
    const { data: group, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select(
        'id, name, contribution_amount, frequency, member_count, current_cycle, public_token, created_at',
      )
      .eq('public_token', token)
      .maybeSingle()

    if (error || !group) throw new NotFoundException('Group not found')

    const { data: members } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('id, name, payout_position, is_active')
      .eq('group_id', group.id)
      .eq('is_active', true)
      .order('payout_position')

    const { data: contributions } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('id, member_id, cycle_number, status, paid_at')
      .eq('group_id', group.id)
      .eq('cycle_number', group.current_cycle)

    return { group, members: members ?? [], contributions: contributions ?? [] }
  }
}
