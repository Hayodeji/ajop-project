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

export enum ContributionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  LATE = 'late',
}

@Entity('contributions')
@Index(['groupId'])
@Index(['memberId'])
@Index(['status'])
@Unique('unique_member_cycle', ['memberId', 'cycleNumber'])
@Check(`"cycle_number" >= 1`)
export class ContributionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'integer' })
  cycleNumber: number;

  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  status: ContributionStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'uuid', nullable: true })
  markedBy: string;

  @Column({ type: 'boolean', default: false })
  memberRepliedPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => GroupEntity, (group) => group.contributions, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: GroupEntity;

  @ManyToOne(() => GroupMemberEntity, (member) => member.contributions, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: GroupMemberEntity;
}
