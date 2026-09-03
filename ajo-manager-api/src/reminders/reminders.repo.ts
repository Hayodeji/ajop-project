import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { ContributionEntity, ContributionStatus } from '../database/entities/contribution.entity'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { SubscriptionEntity } from '../database/entities/subscription.entity'

@Injectable()
export class RemindersRepo {
  constructor(
    @InjectRepository(ContributionEntity)
    private readonly contributionsRepo: Repository<ContributionEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly membersRepo: Repository<GroupMemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getGroupsForReminders() {
    const qb = this.groupsRepo.createQueryBuilder('g')
      .innerJoin(SubscriptionEntity, 's', 's.userId = g.adminId')
      .where('s.plan IN (:...plans)', { plans: ['smart', 'pro'] })
      .andWhere('s.status IN (:...status)', { status: ['trialing', 'active'] })
      .select(['g.id', 'g.name', 'g.currentCycle', 'g.frequency', 'g.adminId'])

    const rows = await qb.getRawMany()
    return rows.map(r => ({ id: r.g_id, name: r.g_name, current_cycle: r.g_currentCycle, frequency: r.g_frequency, admin_id: r.g_adminId }))
  }

  async getContributionsDueIn(days: number) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dayStart = new Date(target)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(target)
    dayEnd.setHours(23, 59, 59, 999)

    const qb = this.contributionsRepo.createQueryBuilder('c')
      .innerJoinAndSelect('c.member', 'm')
      .innerJoinAndSelect('c.group', 'g')
      .innerJoin(SubscriptionEntity, 's', 's.userId = g.adminId')
      .where('c.status = :status', { status: ContributionStatus.PENDING })
      .andWhere('c.dueDate >= :start', { start: dayStart.toISOString() })
      .andWhere('c.dueDate <= :end', { end: dayEnd.toISOString() })
      .andWhere('s.plan IN (:...plans)', { plans: ['smart', 'pro'] })
      .andWhere('s.status IN (:...status)', { status: ['trialing', 'active'] })

    const contributions = await qb.getMany()

    return contributions.map(c => ({
      id: c.id,
      group_id: c.groupId,
      member_id: c.memberId,
      cycle_number: c.cycleNumber,
      status: c.status,
      due_date: c.dueDate,
      group_members: { id: c.member.id, name: c.member.name, phone: c.member.phone },
      groups: { id: c.group.id, name: c.group.name, current_cycle: c.group.currentCycle },
    }))
  }

  async getOverdueContributions(daysPast: number) {
    const target = new Date()
    target.setDate(target.getDate() - daysPast)
    const dayStart = new Date(target)
    dayStart.setHours(0, 0, 0, 0)

    const qb = this.contributionsRepo.createQueryBuilder('c')
      .innerJoinAndSelect('c.member', 'm')
      .innerJoinAndSelect('c.group', 'g')
      .innerJoin(SubscriptionEntity, 's', 's.userId = g.adminId')
      .where('c.status = :status', { status: ContributionStatus.PENDING })
      .andWhere('c.dueDate <= :dayStart', { dayStart: dayStart.toISOString() })
      .andWhere('s.plan IN (:...plans)', { plans: ['smart', 'pro'] })
      .andWhere('s.status IN (:...status)', { status: ['trialing', 'active'] })

    const contributions = await qb.getMany()

    return contributions.map(c => ({
      id: c.id,
      group_id: c.groupId,
      member_id: c.memberId,
      cycle_number: c.cycleNumber,
      status: c.status,
      due_date: c.dueDate,
      group_members: { id: c.member.id, name: c.member.name, phone: c.member.phone },
      groups: { id: c.group.id, name: c.group.name, current_cycle: c.group.currentCycle },
    }))
  }

  async getPendingContributions(groupId: string, cycleNumber: number) {
    const contributions = await this.contributionsRepo.find({
      where: { groupId, cycleNumber, status: ContributionStatus.PENDING },
      relations: { member: true },
    })

    return contributions.map(c => ({ member_id: c.memberId, group_members: { name: c.member.name, phone: c.member.phone, id: c.member.id } }))
  }
}
