import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../supabase/supabase.service'
import axios from 'axios'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  // 7am UTC = 8am WAT
  @Cron('0 7 * * *')
  async sendDailyReminders() {
    this.logger.log('Running daily contribution reminders')

    // Only for smart and pro plan groups
    const { data: groups } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id, name, current_cycle, admin_id, subscriptions!inner(plan, status)')
      .in('subscriptions.plan', ['smart', 'pro'])
      .in('subscriptions.status', ['trial', 'active'])

    if (!groups?.length) return

    for (const group of groups) {
      await this.sendGroupReminders(group)
    }
  }

  private async sendGroupReminders(group: any) {
    const { data: pendingMembers } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('member_id, group_members(name, phone)')
      .eq('group_id', group.id)
      .eq('cycle_number', group.current_cycle)
      .eq('status', 'pending')

    if (!pendingMembers?.length) return

    for (const contrib of pendingMembers) {
      const member = contrib.group_members as any
      if (member?.phone) {
        await this.sendWhatsApp(
          member.phone,
          `Hi ${member.name}, this is a reminder to make your contribution for ${group.name} (Cycle ${group.current_cycle}). Please pay as soon as possible. — AjoPot`,
        )
      }
    }
  }

  async sendWhatsApp(phone: string, message: string): Promise<void> {
    const apiUrl = this.config.get<string>('WHATSAPP_API_URL')
    const token = this.config.get<string>('WHATSAPP_API_TOKEN')
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID')

    if (!apiUrl || !token || !phoneId) {
      this.logger.warn('WhatsApp API not configured, skipping message to ' + phone)
      return
    }

    try {
      await axios.post(
        `${apiUrl}/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'text',
          text: { body: message },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      )
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp to ${phone}: ${err.message}`)
    }
  }
}
