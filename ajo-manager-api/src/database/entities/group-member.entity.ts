import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
  Unique,
} from 'typeorm';
import { GroupEntity } from './group.entity';
import { ContributionEntity } from './contribution.entity';
import { PayoutEntity } from './payout.entity';

@Entity('group_members')
@Index(['groupId'])
@Unique('unique_group_phone', ['groupId', 'phone'])
@Check(`"payout_position" >= 1`)
export class GroupMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  phone: string;

  @Column({ type: 'integer' })
  payoutPosition: number;

  @Column({ type: 'bigint', default: 0 })
  outstandingFines: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'text', nullable: true })
  bankName: string;

  @Column({ type: 'text', nullable: true })
  accountNumber: string;

  @Column({ type: 'text', nullable: true })
  accountName: string;

  @ManyToOne(() => GroupEntity, (group) => group.members, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: GroupEntity;

  @OneToMany(() => ContributionEntity, (contribution) => contribution.member, {
    cascade: true,
    eager: false,
  })
  contributions: ContributionEntity[];

  @OneToMany(() => PayoutEntity, (payout) => payout.member, {
    cascade: true,
    eager: false,
  })
  payouts: PayoutEntity[];
}
