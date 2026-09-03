import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: true })
  userId: string

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'boolean', default: false })
  isRead: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
