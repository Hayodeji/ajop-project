import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { GroupsRepo } from './groups.repo'
import { CreateGroupInput, UpdateGroupInput } from './groups.dto'
import { Group } from './groups.schema'

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name)

  constructor(
    private readonly groupsRepo: GroupsRepo,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async create(adminId: string, input: CreateGroupInput): Promise<Group> {
    const { groupLimit, isGroupLimitCustom } = await this.subscriptions.getEffectiveLimits(adminId)
    const plan = await this.subscriptions.getUserPlan(adminId)
    const count = await this.groupsRepo.countByAdminId(adminId)

    if (count >= groupLimit) {
      const upgradeHint = isGroupLimitCustom
        ? `Your account has a custom limit of ${groupLimit} group${groupLimit === 1 ? '' : 's'}. Contact support to increase it.`
        : `Your ${plan === 'basic' ? 'Basic' : 'Smart'} plan supports ${groupLimit} group${groupLimit === 1 ? '' : 's'}. Upgrade to ${plan === 'basic' ? 'Smart' : 'Pro'} for more groups.`
      throw new ForbiddenException(upgradeHint)
    }

    const publicToken = randomBytes(16).toString('base64url')

    try {
      return await this.groupsRepo.create(adminId, {
        ...input,
        public_token: publicToken,
      })
    } catch (error) {
      this.logger.error(`Create group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not create the group.')
    }
  }

  async findAllForAdmin(adminId: string): Promise<Group[]> {
    try {
      return await this.groupsRepo.findAll(adminId)
    } catch (error) {
      this.logger.error(`List groups failed: ${error.message}`)
      throw new InternalServerErrorException('Could not load your groups.')
    }
  }

  async findOne(adminId: string, id: string): Promise<Group> {
    let group: Group | null
    try {
      group = await this.groupsRepo.findById(adminId, id)
    } catch (error) {
      this.logger.error(`Fetch group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not load that group.')
    }

    if (!group) {
      throw new NotFoundException('That group was not found.')
    }

    try {
      const members = await this.groupsRepo.getActiveMembers(id)
      group.rotation_schedule = members.map(m => ({
        position: m.payout_position,
        member_name: m.name,
        collects_on_cycle: m.payout_position,
      }))
    } catch (error) {
      this.logger.error(`Fetch group members failed: ${error.message}`)
      // Don't fail the whole request if schedule fails
    }

    return group
  }

  async update(
    adminId: string,
    id: string,
    input: UpdateGroupInput,
  ): Promise<Group> {
    await this.findOne(adminId, id)

    try {
      return await this.groupsRepo.update(adminId, id, input)
    } catch (error) {
      this.logger.error(`Update group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not update the group.')
    }
  }

  async remove(adminId: string, id: string): Promise<boolean> {
    await this.findOne(adminId, id)

    try {
      await this.groupsRepo.delete(adminId, id)
      return true
    } catch (error) {
      this.logger.error(`Delete group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not delete the group.')
    }
  }
}
