import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { MarkContributionDto } from './dto/mark-contribution.dto'

@Injectable()
export class ContributionsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async getContributions(
    groupId: string,
    adminId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    await this.validateGroupOwnership(groupId, adminId)

    const plan = await this.subscriptions.getUserPlan(adminId)
    const query = this.supabase
      .getAdminClient()
      .from('contributions')
      .select('*, group_members(name, phone, payout_position)')
      .eq('group_id', groupId)
      .order('cycle_number', { ascending: false })
      .order('created_at', { ascending: false })

    // Full history only for smart and pro
    if (plan === 'basic') {
      const { data: group } = await this.supabase
        .getAdminClient()
        .from('groups')
        .select('current_cycle')
        .eq('id', groupId)
        .single()
      query.eq('cycle_number', group?.current_cycle ?? 1)
    } else if (fromDate && toDate) {
      query.gte('paid_at', fromDate).lte('paid_at', toDate)
    }

    const { data, error } = await query
    if (error) throw new NotFoundException(error.message)
    return data
  }

  async markContribution(groupId: string, adminId: string, dto: MarkContributionDto) {
    await this.validateGroupOwnership(groupId, adminId)

    const paidAt = dto.status === 'paid' ? new Date().toISOString() : null

    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('id')
      .eq('group_id', groupId)
      .eq('member_id', dto.memberId)
      .eq('cycle_number', dto.cycleNumber)
      .maybeSingle()

    if (existing) {
      const { data, error } = await this.supabase
        .getAdminClient()
        .from('contributions')
        .update({ status: dto.status, paid_at: paidAt, marked_by: adminId })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new NotFoundException(error.message)
      return data
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .insert({
        group_id: groupId,
        member_id: dto.memberId,
        cycle_number: dto.cycleNumber,
        status: dto.status,
        paid_at: paidAt,
        marked_by: adminId,
      })
      .select()
      .single()

    if (error) throw new NotFoundException(error.message)
    return data
  }

  private async validateGroupOwnership(groupId: string, adminId: string) {
    const { data } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .eq('admin_id', adminId)
      .maybeSingle()
    if (!data) throw new ForbiddenException('Group not found or access denied')
  }
}
