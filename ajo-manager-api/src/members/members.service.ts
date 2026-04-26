import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { InviteMemberDto } from './dto/invite-member.dto'
import { PLAN_MEMBER_LIMITS } from '../subscriptions/subscriptions.types'

@Injectable()
export class MembersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async getMembers(groupId: string, adminId: string) {
    await this.validateGroupOwnership(groupId, adminId)
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('payout_position')
    if (error) throw new NotFoundException(error.message)
    return data
  }

  async inviteMember(groupId: string, adminId: string, dto: InviteMemberDto) {
    await this.validateGroupOwnership(groupId, adminId)

    const plan = await this.subscriptions.getUserPlan(adminId)
    const memberLimit = PLAN_MEMBER_LIMITS[plan]

    const { count } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_active', true)

    if ((count ?? 0) >= memberLimit) {
      throw new ForbiddenException(
        `Your ${plan} plan allows a maximum of ${memberLimit} members per group. Upgrade to add more.`,
      )
    }

    const { data: positionConflict } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('payout_position', dto.payoutPosition)
      .maybeSingle()

    if (positionConflict) {
      throw new ConflictException(`Payout position ${dto.payoutPosition} is already taken`)
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .insert({
        group_id: groupId,
        name: dto.name,
        phone: dto.phone,
        payout_position: dto.payoutPosition,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new ConflictException(error.message)
    return data
  }

  async updateMember(
    groupId: string,
    memberId: string,
    adminId: string,
    updates: Partial<{
      name: string
      phone: string
      payout_position: number
      is_active: boolean
    }>,
  ) {
    await this.validateGroupOwnership(groupId, adminId)
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .update(updates)
      .eq('id', memberId)
      .eq('group_id', groupId)
      .select()
      .single()
    if (error) throw new NotFoundException(error.message)
    return data
  }

  async removeMember(groupId: string, memberId: string, adminId: string) {
    await this.validateGroupOwnership(groupId, adminId)
    const { error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('group_id', groupId)
    if (error) throw new NotFoundException(error.message)
    return { success: true }
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
