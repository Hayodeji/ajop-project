import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ReminderLogEntity } from '../database/entities/reminder-log.entity'

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ReminderLogEntity)
    private readonly reminderLogRepo: Repository<ReminderLogEntity>,
  ) {}

  /**
   * Normalize phone number: remove leading + and spaces
   */
  private normalizePhone(phone: string): string {
    if (!phone) return ''
    return phone.replace(/^\+/, '').replace(/\s/g, '')
  }

  /**
   * Send a WhatsApp message and log it to reminder_logs
   * @param phone - Recipient phone number (with or without +)
   * @param message - Message body
   * @param recipientId - Optional: member/user ID for tracking
   * @param channel - Channel type (default: 'whatsapp')
   * @returns true if sent successfully, false otherwise
   */
  async sendMessage(
    phone: string,
    message: string,
    recipientId?: string,
    channel: string = 'whatsapp',
  ): Promise<boolean> {
    const apiUrl = this.config.get<string>('WHATSAPP_API_URL')
    const token = this.config.get<string>('WHATSAPP_API_TOKEN')
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID')

    if (!apiUrl || !token || !phoneId) {
      this.logger.warn(
        `WhatsApp API not configured, skipping message to ${phone}. ` +
        `(Check WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID)`,
      )
      return false
    }

    const normalizedPhone = this.normalizePhone(phone)
    if (!normalizedPhone) {
      this.logger.warn('Invalid phone number provided')
      return false
    }

    try {
      await axios.post(
        `${apiUrl}/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      // Log successful send to reminder_logs
      await this.logReminder(recipientId, channel)

      this.logger.log(`WhatsApp message sent to ${normalizedPhone}`)
      return true
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message
      this.logger.error(
        `Failed to send WhatsApp to ${normalizedPhone}: ${errorMsg}`,
      )

      // Log failed send to reminder_logs
      await this.logReminder(recipientId, channel)

      return false
    }
  }

  /**
   * Log a reminder to the database
   */
  private async logReminder(
    recipientId: string | undefined,
    channel: string = 'whatsapp',
  ): Promise<void> {
    try {
      const log = this.reminderLogRepo.create({
        memberId: recipientId,
        channel,
      })
      await this.reminderLogRepo.save(log)
    } catch (err: any) {
      this.logger.error(`Failed to log reminder: ${err.message}`)
    }
  }

  /**
   * Check if a reminder was already sent to this recipient in the last N hours
   */
  async hasRecentReminder(
    recipient: string,
    hoursAgo: number = 24,
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hoursAgo)

      const count = await this.reminderLogRepo.createQueryBuilder('r')
        .where('r.memberId = :recipient', { recipient })
        .andWhere('r.sentAt >= :cutoff', { cutoff: cutoffTime.toISOString() })
        .getCount()

      return count > 0
    } catch (err: any) {
      this.logger.warn(`Error checking recent reminder: ${err.message}`)
      return false
    }
  }
}
