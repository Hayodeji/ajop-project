import { Injectable, Logger } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

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
  target_id?: string
  meta?: Record<string, any>
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private readonly supabase: SupabaseService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      const { error } = await this.supabase.getAdminClient().from('audit_logs').insert({
        action: entry.event_type,       // schema column: action
        actor_id: entry.actor_id ?? null,
        target_id: entry.target_id ?? null,
        metadata: entry.meta ?? null,   // schema column: metadata
      })
      if (error) this.logger.warn(`Audit log insert failed: ${error.message}`)
    } catch (err) {
      this.logger.warn(`Audit log error: ${err?.message}`)
    }
  }
}
