import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { RemindersRepo } from './reminders.repo'
import { WhatsAppService } from '../whatsapp/whatsapp.service'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly remindersRepo: RemindersRepo,
    private readonly whatsApp: WhatsAppService,
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

      const hasRecent = await this.whatsApp.hasRecentReminder(member.phone)
      if (hasRecent) {
        this.logger.log(`Skipping reminder for ${member.phone} (already reminded in last 24h)`)
        continue
      }

      const message = `Hi ${member.name} 👋, just a reminder that your contribution for *${group.name}* (Cycle ${contrib.cycle_number}) is due in *2 days*. Please make payment on time to avoid late charges. — AjoPot`
      await this.whatsApp.sendMessage(member.phone, message, member.id, 'payment_reminder')
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

      const hasRecent = await this.whatsApp.hasRecentReminder(member.phone)
      if (hasRecent) {
        this.logger.log(`Skipping overdue reminder for ${member.phone} (already reminded in last 24h)`)
        continue
      }

      const message = `Hi ${member.name}, your contribution for *${group.name}* (Cycle ${contrib.cycle_number}) was due 2 days ago and is still unpaid. Please make payment as soon as possible to avoid late fees. — AjoPot`
      await this.whatsApp.sendMessage(member.phone, message, member.id, 'overdue_reminder')
    }
  }

  /** Manual trigger: sends reminders to all pending members in a group (on-demand) */
  async triggerManualGroupReminders(group: any) {
    this.logger.log(`Manual reminders triggered for group ${group.id}`)
    const pendingMembers = await this.remindersRepo.getPendingContributions(group.id, group.current_cycle)

    if (!pendingMembers?.length) {
      this.logger.log(`No pending members in group ${group.id}`)
      return {
        sent: 0,
        noPhone: 0,
        totalPending: 0,
      }
    }

    let sent = 0
    let noPhone = 0

    for (const contrib of pendingMembers) {
      const member = contrib.group_members as any
      if (!member?.phone) {
        noPhone++
        continue
      }

      const message = `Hi ${member.name} 👋, this is a reminder from your Ajo admin to contribute to *${group.name}* (Cycle ${group.current_cycle}). Please make payment as soon as possible. — AjoPot`
      const success = await this.whatsApp.sendMessage(member.phone, message, member.id, 'manual_reminder')
      if (success) sent++
    }

    this.logger.log(
      `Manual reminders sent: ${sent}/${pendingMembers.length} (${noPhone} without phone)`,
    )

    return {
      sent,
      noPhone,
      totalPending: pendingMembers.length,
    }
  }
}
