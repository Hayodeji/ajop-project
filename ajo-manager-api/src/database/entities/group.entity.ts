import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { GroupMemberEntity } from './group-member.entity';
import { ContributionEntity } from './contribution.entity';
import { PayoutEntity } from './payout.entity';

export enum GroupFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

@Entity('groups')
@Index(['adminId'])
@Index(['publicToken'])
@Check(`"contribution_amount" > 0`)
@Check(`"member_count" >= 2 AND "member_count" <= 100`)
@Check(`"current_cycle" >= 1`)
export class GroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'bigint' })
  contributionAmount: number;

  @Column({ type: 'bigint', default: 0 })
  lateFeeAmount: number;

  @Column({
    type: 'enum',
    enum: GroupFrequency,
    default: GroupFrequency.MONTHLY,
  })
  frequency: GroupFrequency;

  @Column({ type: 'integer' })
  memberCount: number;

  @Column({ type: 'integer', default: 1 })
  currentCycle: number;

  @Column({ type: 'text', unique: true })
  publicToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupMemberEntity, (member) => member.group, {
    cascade: true,
    eager: false,
  })
  members: GroupMemberEntity[];

  @OneToMany(() => ContributionEntity, (contribution) => contribution.group, {
    cascade: true,
    eager: false,
  })
  contributions: ContributionEntity[];

  @OneToMany(() => PayoutEntity, (payout) => payout.group, {
    cascade: true,
    eager: false,
  })
  payouts: PayoutEntity[];
}
