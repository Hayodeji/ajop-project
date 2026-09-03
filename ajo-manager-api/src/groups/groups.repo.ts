import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { Group } from './groups.schema'
import { CreateGroupInput, UpdateGroupInput } from './groups.dto'

@Injectable()
export class GroupsRepo {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupsRepository: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly groupMembersRepository: Repository<GroupMemberEntity>,
  ) {}

  private mapGroup(group: GroupEntity): Group {
    return {
      id: group.id,
      admin_id: group.adminId,
      name: group.name,
      contribution_amount: Number(group.contributionAmount),
      late_fee_amount: Number(group.lateFeeAmount ?? 0),
      frequency: group.frequency,
      member_count: group.memberCount,
      current_cycle: group.currentCycle,
      public_token: group.publicToken,
      created_at: group.createdAt,
    }
  }

  private mapMember(member: GroupMemberEntity) {
    return {
      name: member.name,
      payout_position: member.payoutPosition,
    }
  }

  async create(adminId: string, input: CreateGroupInput, publicToken: string): Promise<Group> {
    const group = this.groupsRepository.create({
      adminId,
      name: input.name,
      contributionAmount: input.contribution_amount,
      frequency: input.frequency,
      memberCount: input.member_count,
      publicToken,
    })

    const saved = await this.groupsRepository.save(group)
    return this.mapGroup(saved)
  }

  async countByAdminId(adminId: string): Promise<number> {
    return await this.groupsRepository.count({ where: { adminId } })
  }

  async findAll(adminId: string): Promise<Group[]> {
    const groups = await this.groupsRepository.find({
      where: { adminId },
      order: { createdAt: 'DESC' },
    })
    return groups.map((group) => this.mapGroup(group))
  }

  async findById(adminId: string, id: string): Promise<Group | null> {
    const group = await this.groupsRepository.findOne({
      where: { id, adminId },
    })
    return group ? this.mapGroup(group) : null
  }

  async update(adminId: string, id: string, input: UpdateGroupInput): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id, adminId },
    })
    if (!group) {
      throw new Error('Group not found')
    }

    Object.assign(group, {
      name: input.name ?? group.name,
      contributionAmount: input.contribution_amount ?? group.contributionAmount,
      frequency: input.frequency ?? group.frequency,
      memberCount: input.member_count ?? group.memberCount,
    })

    const updated = await this.groupsRepository.save(group)
    return this.mapGroup(updated)
  }

  async delete(adminId: string, id: string): Promise<void> {
    await this.groupsRepository.delete({ id, adminId })
  }

  async getActiveMembers(groupId: string) {
    const members = await this.groupMembersRepository.find({
      where: { groupId, isActive: true },
      order: { payoutPosition: 'ASC' },
    })
    return members.map((member) => this.mapMember(member))
  }
}
