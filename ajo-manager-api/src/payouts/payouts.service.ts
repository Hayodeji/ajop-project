import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common'
import { GroupsRepo } from '../groups/groups.repo'
import { AuditService } from '../audit/audit.service'
import { PayoutsRepo } from './payouts.repo'
import { CreatePayoutInput } from './payouts.dto'
import { Payout } from './payouts.schema'

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name)

  constructor(
    private readonly payoutsRepo: PayoutsRepo,
    private readonly groupsRepo: GroupsRepo,
    private readonly audit: AuditService,
  ) {}

  async getPayouts(groupId: string, adminId: string): Promise<Payout[]> {
    await this.validateGroupOwnership(groupId, adminId)
    try {
      return await this.payoutsRepo.findAllByGroup(groupId)
    } catch (error) {
      this.logger.error(`List payouts failed: ${error.message}`)
      throw new NotFoundException('Could not load payouts.')
    }
  }

  async recordPayout(adminId: string, input: CreatePayoutInput): Promise<Payout> {
    const group = await this.validateGroupOwnership(input.group_id, adminId)

    let payout: Payout
    try {
      payout = await this.payoutsRepo.create(input)
    } catch (error) {
      this.logger.error(`Record payout failed: ${error.message}`)
      throw new NotFoundException('Could not record payout.')
    }

    void this.audit.log({
      event_type: 'payout.recorded',
      actor_id: adminId,
      target_id: payout.id,
      meta: {
        group_id: input.group_id,
        group_name: group.name,
        member_id: (input as any).member_id ?? null,
        amount: input.amount,
        cycle: (input as any).cycle_number ?? null,
      },
    })

    return payout
  }

  private async validateGroupOwnership(groupId: string, adminId: string) {
    const group = await this.groupsRepo.findById(adminId, groupId)
    if (!group) throw new ForbiddenException('Group not found or access denied')
    return group
  }
}
