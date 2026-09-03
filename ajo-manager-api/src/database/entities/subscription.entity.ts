import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Check,
} from 'typeorm';

export enum SubscriptionPlan {
  BASIC = 'basic',
  SMART = 'smart',
  PRO = 'pro',
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAYMENT_FAILED = 'payment_failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('subscriptions')
@Index(['userId'])
@Index(['status'])
@Check(`"retry_count" >= 0`)
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'text', nullable: true })
  paystackReference: string;

  @Column({ type: 'text', nullable: true })
  paystackCustomerCode: string;

  @Column({ type: 'text', nullable: true })
  paystackSubscriptionCode: string;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'integer', nullable: true })
  customGroupLimit: number;

  @Column({ type: 'integer', nullable: true })
  customMemberLimit: number;

  @Column({ type: 'text', nullable: true })
  limitsNote: string;

  @CreateDateColumn()
  createdAt: Date;
}
