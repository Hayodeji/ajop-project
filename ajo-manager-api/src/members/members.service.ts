import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { GroupsRepo } from '../groups/groups.repo'
import { MembersRepo } from './members.repo'
import { CreateMemberInput, UpdateMemberInput } from './members.dto'
import { Member } from './members.schema'

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name)

  constructor(
    private readonly membersRepo: MembersRepo,
    private readonly groupsRepo: GroupsRepo,
    private readonly subscriptions: SubscriptionsService,
    private readonly supabase: SupabaseService,
  ) {}

  async getMembers(groupId: string, adminId: string): Promise<Member[]> {
    await this.validateGroupOwnership(groupId, adminId)
    try {
      return await this.membersRepo.findAllByGroup(groupId)
    } catch (error) {
      throw new NotFoundException('Could not load members.')
    }
  }

  async inviteMember(adminId: string, input: CreateMemberInput): Promise<Member> {
    const groupData = await this.validateGroupOwnership(input.group_id, adminId)

    const { memberLimit, isMemberLimitCustom } = await this.subscriptions.getEffectiveLimits(adminId)
    const plan = await this.subscriptions.getUserPlan(adminId)
    const count = await this.membersRepo.countActiveMembers(input.group_id)

    if (count >= memberLimit) {
      const msg = isMemberLimitCustom
        ? `Your account has a custom limit of ${memberLimit} members per group. Contact support to increase it.`
        : `Your ${plan === 'basic' ? 'Basic' : 'Smart'} plan supports up to ${memberLimit} members per group.`
      throw new ForbiddenException(msg)
    }

    if (count >= groupData.member_count) {
      throw new ForbiddenException(
        `This group is full. It was created with a limit of ${groupData.member_count} members.`,
      )
    }

    const positionConflict = await this.membersRepo.findByPosition(input.group_id, input.payout_position)
    if (positionConflict) {
      throw new ConflictException(`Payout position ${input.payout_position} is already taken`)
    }

    let member: Member
    try {
      member = await this.membersRepo.create(input)
    } catch (error) {
      this.logger.error(`Failed to add member: ${error.message}`)
      const isDuplicate = error.message?.toLowerCase().includes('unique constraint') || error.code === '23505'
      throw new ConflictException(
        isDuplicate 
          ? 'A member with this phone number already exists in this group.' 
          : `Could not add member: ${error.message}`
      )
    }

    // Calculate due date based on frequency
    const now = new Date()
    const dueDate = new Date(now)
    if (groupData.frequency === 'weekly') dueDate.setDate(dueDate.getDate() + 7)
    else if (groupData.frequency === 'biweekly') dueDate.setDate(dueDate.getDate() + 14)
    else if (groupData.frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + 1)

    // Auto-generate contribution row for current cycle
    // Note: Moving this to repo eventually if needed, but for now using Supabase service
    await this.supabase.getAdminClient().from('contributions').insert({
      group_id: input.group_id,
      member_id: member.id,
      cycle_number: groupData.current_cycle,
      status: 'pending',
      due_date: dueDate.toISOString(),
    })

    // Send WhatsApp notification
    const adminName = (groupData as any).profiles?.name || 'Admin'
    const amountStr = (groupData.contribution_amount / 100).toLocaleString('en-NG')
    const message = `Hi ${input.name}, you've been added to the '${groupData.name}' ajo group by ${adminName} on AjoPot.\nYour contribution: ₦${amountStr} ${groupData.frequency}.\nYour collection position: #${input.payout_position}.`
    await this.sendWhatsApp(input.phone, message)

    return member
  }

  private async sendWhatsApp(phone: string, message: string) {
    const apiUrl = process.env.WHATSAPP_API_URL
    const token = process.env.WHATSAPP_API_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID

    if (!apiUrl || !token || !phoneId) return

    try {
      await fetch(`${apiUrl}/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'text',
          text: { body: message },
        })
      })
    } catch {
      // ignore
    }
  }

  async updateMember(
    adminId: string,
    input: UpdateMemberInput,
  ): Promise<Member> {
    const member = await this.membersRepo.findById(input.id)
    if (!member) throw new NotFoundException('Member not found.')

    await this.validateGroupOwnership(member.group_id, adminId)

    try {
      return await this.membersRepo.update(input.id, input)
    } catch (error) {
      throw new NotFoundException('Could not update member.')
    }
  }

  async removeMember(adminId: string, id: string): Promise<boolean> {
    const member = await this.membersRepo.findById(id)
    if (!member) throw new NotFoundException('Member not found.')

    await this.validateGroupOwnership(member.group_id, adminId)

    try {
      await this.membersRepo.softDelete(id)
      return true
    } catch (error) {
      throw new NotFoundException('Could not remove member.')
    }
  }

  private async validateGroupOwnership(groupId: string, adminId: string) {
    const group = await this.groupsRepo.findById(adminId, groupId)
    if (!group) throw new ForbiddenException('Group not found or access denied')
    
    // We need the frequency and current_cycle for member creation, so we need the full group object
    // The groupsRepo.findById returns it.
    return group
  }
}
