import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class RemindersRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async getGroupsForReminders() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id, name, current_cycle, admin_id, subscriptions!inner(plan, status)')
      .in('subscriptions.plan', ['smart', 'pro'])
      .in('subscriptions.status', ['trial', 'active'])

    if (error) throw error
    return data || []
  }

  async getPendingContributions(groupId: string, cycleNumber: number) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('member_id, group_members(name, phone)')
      .eq('group_id', groupId)
      .eq('cycle_number', cycleNumber)
      .eq('status', 'pending')

    if (error) throw error
    return data || []
  }
}
