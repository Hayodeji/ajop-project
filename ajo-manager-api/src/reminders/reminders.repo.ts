import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class RemindersRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async getGroupsForReminders() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id, name, current_cycle, frequency, admin_id, subscriptions!inner(plan, status)')
      .in('subscriptions.plan', ['smart', 'pro'])
      .in('subscriptions.status', ['trialing', 'active'])

    if (error) throw error
    return data || []
  }

  async getContributionsDueIn(days: number) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dateStr = target.toISOString().split('T')[0] // YYYY-MM-DD

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select(`
        id, group_id, member_id, cycle_number, status, due_date,
        group_members!inner(name, phone),
        groups!inner(name, current_cycle, subscriptions!inner(plan, status))
      `)
      .eq('status', 'pending')
      .gte('due_date', `${dateStr}T00:00:00.000Z`)
      .lte('due_date', `${dateStr}T23:59:59.999Z`)
      .in('groups.subscriptions.plan', ['smart', 'pro'])
      .in('groups.subscriptions.status', ['trialing', 'active'])

    if (error) throw error
    return data || []
  }

  async getOverdueContributions(daysPast: number) {
    const target = new Date()
    target.setDate(target.getDate() - daysPast)
    const dateStr = target.toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select(`
        id, group_id, member_id, cycle_number, status, due_date,
        group_members!inner(name, phone),
        groups!inner(name, current_cycle, subscriptions!inner(plan, status))
      `)
      .eq('status', 'pending')
      .gte('due_date', `${dateStr}T00:00:00.000Z`)
      .lte('due_date', `${dateStr}T23:59:59.999Z`)
      .in('groups.subscriptions.plan', ['smart', 'pro'])
      .in('groups.subscriptions.status', ['trialing', 'active'])

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
