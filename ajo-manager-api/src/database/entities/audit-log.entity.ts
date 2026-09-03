import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: true })
  actorId: string

  @Column({ type: 'text' })
  action: string

  @Column({ type: 'text', nullable: true })
  targetType: string

  @Column({ type: 'uuid', nullable: true })
  targetId: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: any

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
