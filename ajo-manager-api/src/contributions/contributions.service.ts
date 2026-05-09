import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { GroupsRepo } from '../groups/groups.repo'
import { MembersRepo } from '../members/members.repo'
import { ContributionsRepo } from './contributions.repo'
import { CreateContributionInput } from './contributions.dto'
import { Contribution, ContributionStatus } from './contributions.schema'

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name)

  constructor(
    private readonly contributionsRepo: ContributionsRepo,
    private readonly groupsRepo: GroupsRepo,
    private readonly membersRepo: MembersRepo,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async getContributions(
    groupId: string,
    adminId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Contribution[]> {
    await this.validateGroupOwnership(groupId, adminId)

    const plan = await this.subscriptions.getUserPlan(adminId)
    let cycleNumber: number | undefined

    if (plan === 'basic') {
      const group = await this.groupsRepo.findById(adminId, groupId)
      cycleNumber = group?.current_cycle ?? 1
    }

    try {
      return await this.contributionsRepo.findAllByGroup(groupId, cycleNumber, fromDate, toDate)
    } catch (error) {
      this.logger.error(`List contributions failed: ${error.message}`)
      throw new NotFoundException(`Could not load contributions: ${error.message}`)
    }
  }

  async markContribution(adminId: string, input: CreateContributionInput): Promise<Contribution> {
    const group = await this.validateGroupOwnership(input.group_id, adminId)

    const paidAt = input.status === ContributionStatus.PAID ? new Date().toISOString() : null

    const existing = await this.contributionsRepo.findExisting(input.group_id, input.member_id, input.cycle_number)

    let contribution: Contribution
    try {
      if (existing) {
        contribution = await this.contributionsRepo.update(existing.id, {
          status: input.status,
          paid_at: paidAt,
          marked_by: adminId,
        })
      } else {
        contribution = await this.contributionsRepo.create({
          group_id: input.group_id,
          member_id: input.member_id,
          cycle_number: input.cycle_number,
          status: input.status,
          paid_at: paidAt,
          marked_by: adminId,
        })
      }
    } catch (error) {
      this.logger.error(`Mark contribution failed: ${error.message}`)
      throw new NotFoundException('Could not mark contribution.')
    }

    // Late penalty tracking
    if (input.status === ContributionStatus.LATE && group.late_fee_amount > 0) {
      const member = await this.membersRepo.findById(input.member_id)
      if (member) {
        const newFines = (Number((member as any).outstanding_fines) || 0) + Number(group.late_fee_amount)
        await this.membersRepo.update(input.member_id, { outstanding_fines: newFines } as any)
      }
    }

    // Auto-generate next cycle rows if all paid for current cycle
    if (input.status === ContributionStatus.PAID && input.cycle_number === group.current_cycle) {
      const count = await this.contributionsRepo.countPaidInCycle(input.group_id, group.current_cycle)
      
      if (count === group.member_count) {
        const nextCycle = group.current_cycle + 1
        await this.groupsRepo.update(adminId, input.group_id, { current_cycle: nextCycle } as any)

        const now = new Date()
        const dueDate = new Date(now)
        if (group.frequency === 'weekly') dueDate.setDate(dueDate.getDate() + 7)
        else if (group.frequency === 'biweekly') dueDate.setDate(dueDate.getDate() + 14)
        else if (group.frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + 1)

        const activeMembers = await this.groupsRepo.getActiveMembers(input.group_id)
        if (activeMembers.length > 0) {
          const inserts = activeMembers.map((m: any) => ({
            group_id: input.group_id,
            member_id: m.id,
            cycle_number: nextCycle,
            status: 'pending',
            due_date: dueDate.toISOString(),
          }))
          await this.contributionsRepo.bulkInsert(inserts)
        }
      }
    }

    return contribution
  }

  private async validateGroupOwnership(groupId: string, adminId: string) {
    const group = await this.groupsRepo.findById(adminId, groupId)
    if (!group) throw new ForbiddenException('Group not found or access denied')
    return group
  }
}
