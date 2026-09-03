import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SubscriptionsService } from './subscriptions.service'
import { ConfigService } from '@nestjs/config'
import { WhatsAppService } from '../whatsapp/whatsapp.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { SubscriptionEntity } from '../database/entities/subscription.entity'
import { ProfileEntity } from '../database/entities/profile.entity'
import { NotificationEntity } from '../database/entities/notification.entity'
import { SubscriptionStatus } from './subscriptions.schema'

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepo: Repository<SubscriptionEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
    private readonly whatsApp: WhatsAppService,
  ) {}

  // Fetch profiles by user_ids and return a lookup map.
  // subscriptions.user_id → auth.users, profiles.user_id → auth.users.
  // There is no direct FK between the two tables so PostgREST embedded
  // resources don't work. We do a separate query and join in memory.
  private async loadProfiles(userIds: string[]): Promise<Record<string, any>> {
    if (!userIds.length) return {}
    const rows = await this.profileRepo.findBy({ userId: In(userIds) })
    const map: Record<string, any> = {}
    for (const p of rows ?? []) map[p.userId] = p
    return map
  }

  @Cron('0 7 * * *', { timeZone: 'Africa/Lagos' })
  async handleSubscriptionBilling() {
    this.logger.log('Running daily subscription billing cron');
    const now = new Date();

    // Trials ending in the next 24 h
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endingSoon = await this.subscriptionsRepo.createQueryBuilder('s')
      .where('s.status = :status', { status: 'trialing' })
      .andWhere('s.trialEndsAt > :now', { now: now.toISOString() })
      .andWhere('s.trialEndsAt <= :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getMany()

    if (endingSoon?.length) {
      const profileMap = await this.loadProfiles(endingSoon.map((s: any) => s.userId));
      for (const sub of endingSoon) {
        const profile = profileMap[sub.userId];
        if (profile?.phone) {
          const planAmounts: Record<string, number> = { basic: 1500, smart: 3000, pro: 5000 };
          const amount = planAmounts[sub.plan] ?? 0;
          await this.whatsApp.sendMessage(
            profile.phone,
            `Hi ${profile.name}, your AjoPot free trial ends tomorrow. Your ${sub.plan} plan will be activated and ₦${amount} charged to your saved card. Questions? Reply to this message.`,
            sub.userId,
            'trial_ending_reminder',
          );
        }
        await this.notificationsRepo.save(this.notificationsRepo.create({ userId: sub.userId, message: `Your free trial ends tomorrow. Your ${sub.plan} plan will be activated soon.` }))
      }
    }

    // Expired trials — attempt to charge
    const expiredTrials = await this.subscriptionsRepo.createQueryBuilder('s')
      .where('s.status = :status', { status: 'trialing' })
      .andWhere('s.trialEndsAt <= :now', { now: now.toISOString() })
      .getMany()

    if (expiredTrials?.length) {
      const profileMap = await this.loadProfiles(expiredTrials.map((s: any) => s.userId));
      for (const sub of expiredTrials) {
        await this.chargeSubscription(sub, profileMap[sub.userId], false);
      }
    }

    // Retry payment_failed (retry_count < 3)
    const failedRetries = await this.subscriptionsRepo.createQueryBuilder('s')
      .where('s.status = :status', { status: 'payment_failed' })
      .andWhere('s.retryCount < :max', { max: 3 })
      .getMany()

    if (failedRetries?.length) {
      const profileMap = await this.loadProfiles(failedRetries.map((s: any) => s.userId))
      for (const sub of failedRetries) {
        await this.chargeSubscription(sub, profileMap[sub.userId], true)
      }
    }
  }

  private async chargeSubscription(sub: any, profile: any, isRetry: boolean) {
    try {
      const email = profile?.phone
        ? `${profile.phone.replace(/\D/g, '')}@ajopot.app`
        : `${sub.user_id}@ajopot.app`;
      const authCode = sub.paystackSubscriptionCode;

      if (!authCode) {
        await this.markPaymentFailed(sub.userId, sub.retryCount, isRetry)
        return;
      }

      const planAmounts: Record<string, number> = { basic: 150000, smart: 300000, pro: 500000 };
      const amount = planAmounts[sub.plan] ?? 0;

      const paystackKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
      const res = await fetch('https://api.paystack.co/transaction/charge_authorization', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, amount, authorization_code: authCode }),
      });

      const json = await res.json() as any;
      if (json.status && json.data?.status === 'success') {
        await this.subscriptionsService.activateSubscription(sub.userId, sub.plan, json.data.reference)
      } else {
        await this.markPaymentFailed(sub.userId, sub.retryCount, isRetry)
      }
    } catch (err) {
      this.logger.error(`Charge failed for user ${sub.userId}: ${err}`);
    }
  }

  private async markPaymentFailed(userId: string, currentRetries: number, isRetry: boolean) {
    const newCount = (currentRetries || 0) + (isRetry ? 1 : 0)
    await this.subscriptionsRepo.update({ userId }, { status: SubscriptionStatus.PAYMENT_FAILED, retryCount: newCount })

    if (newCount >= 3) {
      await this.profileRepo.update({ userId }, { isSuspended: true })
    }
  }
}
