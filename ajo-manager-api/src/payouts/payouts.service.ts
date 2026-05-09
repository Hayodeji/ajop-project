import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common'
import { GroupsRepo } from '../groups/groups.repo'
import { PayoutsRepo } from './payouts.repo'
import { CreatePayoutInput } from './payouts.dto'
import { Payout } from './payouts.schema'

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name)

  constructor(
    private readonly payoutsRepo: PayoutsRepo,
    private readonly groupsRepo: GroupsRepo,
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
    await this.validateGroupOwnership(input.group_id, adminId)

    try {
      return await this.payoutsRepo.create(input)
    } catch (error) {
      this.logger.error(`Record payout failed: ${error.message}`)
      throw new NotFoundException('Could not record payout.')
    }
  }

  private async validateGroupOwnership(groupId: string, adminId: string) {
    const group = await this.groupsRepo.findById(adminId, groupId)
    if (!group) throw new ForbiddenException('Group not found or access denied')
    return group
  }
}
