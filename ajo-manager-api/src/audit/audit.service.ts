import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLogEntity } from '../database/entities/audit-log.entity'

export type AuditEventType =
  | 'group.created'
  | 'group.deleted'
  | 'member.added'
  | 'member.removed'
  | 'contribution.paid'
  | 'contribution.late'
  | 'payout.recorded'
  | 'user.signup'
  | 'subscription.activated'

export interface AuditEntry {
  event_type: AuditEventType
  actor_id?: string
  target_type?: string
  target_id?: string
  meta?: Record<string, any>
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      const record = {
        actorId: entry.actor_id || null,
        action: entry.event_type,
        targetType: entry.target_type || null,
        targetId: entry.target_id || null,
        metadata: entry.meta || null,
      } as AuditLogEntity
      await this.auditRepo.save(record)
    } catch (err) {
      this.logger.warn(`Audit log error: ${err?.message}`)
    }
  }
}
