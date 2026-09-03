import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  Unique,
} from 'typeorm';
import { GroupEntity } from './group.entity';
import { GroupMemberEntity } from './group-member.entity';

@Entity('payouts')
@Index(['groupId'])
@Index(['memberId'])
@Unique('unique_group_cycle', ['groupId', 'cycleNumber'])
@Check(`"cycle_number" >= 1`)
@Check(`"amount" > 0`)
export class PayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'integer' })
  cycleNumber: number;

  @Column({ type: 'bigint' })
  amount: number;

  @CreateDateColumn()
  paidOutAt: Date;

  @Column({ type: 'text', nullable: true })
  receiptUrl: string;

  @ManyToOne(() => GroupEntity, (group) => group.payouts, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: GroupEntity;

  @ManyToOne(() => GroupMemberEntity, (member) => member.payouts, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: GroupMemberEntity;
}
