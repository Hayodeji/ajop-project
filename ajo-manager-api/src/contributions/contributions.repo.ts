import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContributionEntity, ContributionStatus } from '../database/entities/contribution.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'

@Injectable()
export class ContributionsRepo {
  constructor(
    @InjectRepository(ContributionEntity)
    private readonly contributionsRepo: Repository<ContributionEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly membersRepo: Repository<GroupMemberEntity>,
  ) {}

  async findExisting(groupId: string, memberId: string, cycleNumber: number): Promise<any | null> {
    return this.contributionsRepo.findOne({ where: { groupId, memberId, cycleNumber } })
  }

  async create(input: any): Promise<any> {
    const entity = this.contributionsRepo.create({
      groupId: input.group_id || input.groupId,
      memberId: input.member_id || input.memberId,
      cycleNumber: input.cycle_number || input.cycleNumber,
      status: input.status,
      paidAt: input.paid_at || input.paidAt,
      dueDate: input.due_date || input.dueDate,
      markedBy: input.marked_by || input.markedBy,
    })
    return this.contributionsRepo.save(entity)
  }

  async update(id: string, input: any): Promise<any> {
    await this.contributionsRepo.update(id, {
      cycleNumber: input.cycle_number ?? input.cycleNumber,
      status: input.status,
      paidAt: input.paid_at ?? input.paidAt,
      dueDate: input.due_date ?? input.dueDate,
      markedBy: input.marked_by ?? input.markedBy,
    })
    return this.contributionsRepo.findOne({ where: { id } })
  }

  async findAllByGroup(groupId: string, cycleNumber?: number, fromDate?: string, toDate?: string): Promise<any[]> {
    const qb = this.contributionsRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.member', 'm')
      .where('c.groupId = :groupId', { groupId })
      .orderBy('c.cycleNumber', 'DESC')
      .addOrderBy('c.id', 'DESC')

    if (cycleNumber) qb.andWhere('c.cycleNumber = :cycleNumber', { cycleNumber })
    if (fromDate && toDate) qb.andWhere('c.paidAt >= :fromDate AND c.paidAt <= :toDate', { fromDate, toDate })

    const rows = await qb.getMany()
    return rows.map(c => ({
      id: c.id,
      group_id: c.groupId,
      member_id: c.memberId,
      cycle_number: c.cycleNumber,
      status: c.status,
      paid_at: c.paidAt,
      group_members: c.member ? { name: c.member.name, phone: c.member.phone, payout_position: c.member.payoutPosition } : null,
    }))
  }

  async countPaidInCycle(groupId: string, cycleNumber: number): Promise<number> {
    return this.contributionsRepo.count({ where: { groupId, cycleNumber, status: ContributionStatus.PAID } })
  }

  async bulkInsert(inserts: any[]): Promise<void> {
    const entities = inserts.map(i => this.contributionsRepo.create({
      groupId: i.group_id || i.groupId,
      memberId: i.member_id || i.memberId,
      cycleNumber: i.cycle_number || i.cycleNumber,
      status: i.status,
      paidAt: i.paid_at || i.paidAt,
      dueDate: i.due_date || i.dueDate,
    }))
    await this.contributionsRepo.save(entities)
  }
}
