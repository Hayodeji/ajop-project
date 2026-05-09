import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { RemindersRepo } from './reminders.repo'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly remindersRepo: RemindersRepo,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 7 * * *')
  async sendDailyReminders() {
    this.logger.log('Running daily contribution reminders')

    try {
      const groups = await this.remindersRepo.getGroupsForReminders()
      if (!groups?.length) return

      for (const group of groups) {
        await this.sendGroupReminders(group)
      }
    } catch (error) {
      this.logger.error(`Daily reminders failed: ${error.message}`)
    }
  }

  private async sendGroupReminders(group: any) {
    try {
      const pendingMembers = await this.remindersRepo.getPendingContributions(group.id, group.current_cycle)
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
    } catch (error) {
      this.logger.error(`Group reminders failed for ${group.id}: ${error.message}`)
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
