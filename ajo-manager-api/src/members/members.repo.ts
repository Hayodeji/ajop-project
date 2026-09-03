import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { GroupEntity } from '../database/entities/group.entity'

@Injectable()
export class MembersRepo {
  constructor(
    @InjectRepository(GroupMemberEntity)
    private readonly membersRepo: Repository<GroupMemberEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
  ) {}

  async create(input: any): Promise<any> {
    const entity = this.membersRepo.create({
      groupId: input.group_id || input.groupId,
      name: input.name,
      phone: input.phone,
      payoutPosition: input.payout_position || input.payoutPosition,
      bankName: input.bank_name || input.bankName,
      accountNumber: input.account_number || input.accountNumber,
      accountName: input.account_name || input.accountName,
    })
    return this.membersRepo.save(entity)
  }

  async countActiveMembers(groupId: string): Promise<number> {
    return this.membersRepo.count({ where: { groupId, isActive: true } })
  }

  async findByPosition(groupId: string, position: number): Promise<any | null> {
    return this.membersRepo.findOne({ where: { groupId, payoutPosition: position, isActive: true } })
  }

  async findAllByGroup(groupId: string): Promise<any[]> {
    return this.membersRepo.find({ where: { groupId, isActive: true }, order: { payoutPosition: 'ASC' } })
  }

  async findById(id: string): Promise<any | null> {
    return this.membersRepo.findOne({ where: { id } })
  }

  async update(id: string, input: any): Promise<any> {
    await this.membersRepo.update(id, {
      name: input.name,
      phone: input.phone,
      payoutPosition: input.payout_position ?? input.payoutPosition,
      bankName: input.bank_name ?? input.bankName,
      accountNumber: input.account_number ?? input.accountNumber,
      accountName: input.account_name ?? input.accountName,
      outstandingFines: (input as any).outstanding_fines ?? (input as any).outstandingFines,
      isActive: input.is_active ?? input.isActive,
    })
    return this.membersRepo.findOne({ where: { id } })
  }

  async delete(id: string): Promise<void> {
    await this.membersRepo.delete(id)
  }

  async softDelete(id: string): Promise<void> {
    await this.membersRepo.update(id, { isActive: false })
  }
  
  async getGroupAdminId(groupId: string): Promise<string | null> {
    const g = await this.groupsRepo.findOne({ where: { id: groupId } })
    return g?.adminId || null
  }
}
