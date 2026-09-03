import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Check,
  Unique,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  SUPER_ADMIN = 'super_admin',
}

export enum ProfilePlan {
  BASIC = 'basic',
  SMART = 'smart',
  PRO = 'pro',
}

@Entity('profiles')
@Index(['userId'])
@Index(['role'])
@Unique('unique_phone', ['phone'])
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ProfilePlan,
    default: ProfilePlan.BASIC,
  })
  plan: ProfilePlan;

  @Column({ type: 'boolean', default: false })
  isPro: boolean;

  @Column({ type: 'text', nullable: true, unique: true })
  referralCode: string;

  @Column({ type: 'text', nullable: true })
  referredBy: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  isSuspended: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
