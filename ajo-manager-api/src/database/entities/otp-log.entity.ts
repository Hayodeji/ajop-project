import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('otp_logs')
@Index(['phone', 'expiresAt'])
@Index(['createdAt'], { where: '"verified_at" IS NULL' })
export class OtpLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isVerified(): boolean {
    return this.verifiedAt !== null && this.verifiedAt !== undefined;
  }
}
