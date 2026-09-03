import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('payment_events')
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  eventType: string

  @Column({ type: 'text', nullable: true })
  paystackReference: string

  @Column({ type: 'uuid', nullable: true })
  userId: string

  @Column({ type: 'jsonb', nullable: true })
  payload: any

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
