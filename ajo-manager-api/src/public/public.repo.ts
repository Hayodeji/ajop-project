import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { ContributionEntity } from '../database/entities/contribution.entity'

@Injectable()
export class PublicRepo {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly membersRepo: Repository<GroupMemberEntity>,
    @InjectRepository(ContributionEntity)
    private readonly contributionsRepo: Repository<ContributionEntity>,
  ) {}

  async findGroupByToken(token: string) {
    const g = await this.groupsRepo.findOne({ where: { publicToken: token } })
    if (!g) return null
    return {
      id: g.id,
      name: g.name,
      contribution_amount: g.contributionAmount,
      frequency: g.frequency,
      member_count: g.memberCount,
      current_cycle: g.currentCycle,
      public_token: g.publicToken,
      created_at: g.createdAt,
    }
  }

  async findMembersByGroup(groupId: string) {
    const rows = await this.membersRepo.find({ where: { groupId, isActive: true }, order: { payoutPosition: 'ASC' } })
    return rows.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      payout_position: m.payoutPosition,
      is_active: m.isActive,
      joined_at: m.joinedAt,
      group_id: m.groupId,
    }))
  }

  async findContributionsByGroup(groupId: string, cycleNumber: number) {
    const rows = await this.contributionsRepo.find({ where: { groupId, cycleNumber } })
    return rows.map(r => ({
      id: r.id,
      group_id: r.groupId,
      member_id: r.memberId,
      cycle_number: r.cycleNumber,
      status: r.status,
      paid_at: r.paidAt,
      due_date: r.dueDate,
    }))
  }
}
