import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { ContributionEntity } from './contribution.entity'
import { GroupMemberEntity } from './group-member.entity'

@Entity('reminder_logs')
export class ReminderLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: true })
  contributionId: string

  @Column({ type: 'uuid', nullable: true })
  memberId: string

  @Column({ type: 'text', nullable: true })
  channel: string

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date

  @ManyToOne(() => ContributionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contribution_id' })
  contribution: ContributionEntity

  @ManyToOne(() => GroupMemberEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'member_id' })
  member: GroupMemberEntity
}
