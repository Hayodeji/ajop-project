import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PayoutEntity } from '../database/entities/payout.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'

@Injectable()
export class PayoutsRepo {
  constructor(
    @InjectRepository(PayoutEntity)
    private readonly payoutsRepo: Repository<PayoutEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly membersRepo: Repository<GroupMemberEntity>,
  ) {}

  async create(input: any): Promise<any> {
    const entity = this.payoutsRepo.create({
      groupId: input.group_id || input.groupId,
      memberId: input.member_id || input.memberId,
      cycleNumber: input.cycle_number || input.cycleNumber,
      amount: input.amount,
      paidOutAt: input.paid_out_at || input.paidOutAt,
      receiptUrl: input.receipt_url || input.receiptUrl,
    })
    return this.payoutsRepo.save(entity)
  }

  async findAllByGroup(groupId: string): Promise<any[]> {
    const rows = await this.payoutsRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.member', 'm')
      .where('p.groupId = :groupId', { groupId })
      .orderBy('p.cycleNumber', 'DESC')
      .getMany()

    return rows.map(r => ({ ...r, group_members: r.member ? { name: r.member.name } : null }))
  }

  async findById(id: string): Promise<any | null> {
    return this.payoutsRepo.findOne({ where: { id } })
  }

  async update(id: string, input: any): Promise<any> {
    await this.payoutsRepo.update(id, {
      amount: input.amount,
      receiptUrl: input.receipt_url ?? input.receiptUrl,
      paidOutAt: input.paid_out_at ?? input.paidOutAt,
    })
    return this.payoutsRepo.findOne({ where: { id } })
  }

  async delete(id: string): Promise<void> {
    await this.payoutsRepo.delete(id)
  }
}
