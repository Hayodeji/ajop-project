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

  /** Runs every morning at 7AM. Sends reminders 2 days before and 2 days after due date. */
  @Cron('0 7 * * *')
  async sendDailyReminders() {
    this.logger.log('Running daily smart contribution reminders')

    try {
      await this.sendUpcomingReminders()
      await this.sendOverdueReminders()
    } catch (error) {
      this.logger.error(`Daily reminders failed: ${error.message}`)
    }
  }

  /** Sends "your contribution is due in 2 days" messages */
  private async sendUpcomingReminders() {
    const contributions = await this.remindersRepo.getContributionsDueIn(2)
    this.logger.log(`Found ${contributions.length} upcoming contributions (due in 2 days)`)

    for (const contrib of contributions) {
      const member = contrib.group_members as any
      const group = contrib.groups as any
      if (!member?.phone) continue

      const message = `Hi ${member.name} 👋, just a reminder that your contribution for *${group.name}* (Cycle ${contrib.cycle_number}) is due in *2 days*. Please make payment on time to avoid late charges. — AjoPot`
      await this.sendWhatsApp(member.phone, message)
    }
  }

  /** Sends "you are 2 days overdue" messages to members who still haven't paid */
  private async sendOverdueReminders() {
    const contributions = await this.remindersRepo.getOverdueContributions(2)
    this.logger.log(`Found ${contributions.length} overdue contributions (2 days past due)`)

    for (const contrib of contributions) {
      const member = contrib.group_members as any
      const group = contrib.groups as any
      if (!member?.phone) continue

      const message = `Hi ${member.name}, your contribution for *${group.name}* (Cycle ${contrib.cycle_number}) was due 2 days ago and is still unpaid. Please make payment as soon as possible to avoid late fees. — AjoPot`
      await this.sendWhatsApp(member.phone, message)
    }
  }

  /** Manual trigger: sends reminders to all pending members in a group (on-demand) */
  async triggerManualGroupReminders(group: any) {
    this.logger.log(`Manual reminders triggered for group ${group.id}`)
    const pendingMembers = await this.remindersRepo.getPendingContributions(group.id, group.current_cycle)

    if (!pendingMembers?.length) {
      this.logger.log(`No pending members in group ${group.id}`)
      return
    }

    for (const contrib of pendingMembers) {
      const member = contrib.group_members as any
      if (!member?.phone) continue

      const message = `Hi ${member.name} 👋, this is a reminder from your Ajo admin to contribute to *${group.name}* (Cycle ${group.current_cycle}). Please make payment as soon as possible. — AjoPot`
      await this.sendWhatsApp(member.phone, message)
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
