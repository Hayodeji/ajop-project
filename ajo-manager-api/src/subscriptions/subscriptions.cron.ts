import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { SubscriptionsService } from './subscriptions.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  // Fetch profiles by user_ids and return a lookup map.
  // subscriptions.user_id → auth.users, profiles.user_id → auth.users.
  // There is no direct FK between the two tables so PostgREST embedded
  // resources don't work. We do a separate query and join in memory.
  private async loadProfiles(userIds: string[]): Promise<Record<string, any>> {
    if (!userIds.length) return {};
    const { data } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('user_id, name, phone')
      .in('user_id', userIds);
    const map: Record<string, any> = {};
    for (const p of data ?? []) map[p.user_id] = p;
    return map;
  }

  @Cron('0 7 * * *', { timeZone: 'Africa/Lagos' })
  async handleSubscriptionBilling() {
    this.logger.log('Running daily subscription billing cron');
    const now = new Date();

    // Trials ending in the next 24 h
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: endingSoon } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('status', 'trialing')
      .gt('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', tomorrow.toISOString());

    if (endingSoon?.length) {
      const profileMap = await this.loadProfiles(endingSoon.map((s: any) => s.user_id));
      for (const sub of endingSoon) {
        const profile = profileMap[sub.user_id];
        if (profile?.phone) {
          const planAmounts: Record<string, number> = { basic: 1500, smart: 3000, pro: 5000 };
          const amount = planAmounts[sub.plan] ?? 0;
          await this.sendWhatsApp(
            profile.phone,
            `Hi ${profile.name}, your AjoPot free trial ends tomorrow. Your ${sub.plan} plan will be activated and ₦${amount} charged to your saved card. Questions? Reply to this message.`,
          );
        }
        await this.supabase.getAdminClient().from('notifications').insert({
          user_id: sub.user_id,
          message: `Your free trial ends tomorrow. Your ${sub.plan} plan will be activated soon.`,
        });
      }
    }

    // Expired trials — attempt to charge
    const { data: expiredTrials } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('status', 'trialing')
      .lte('trial_ends_at', now.toISOString());

    if (expiredTrials?.length) {
      const profileMap = await this.loadProfiles(expiredTrials.map((s: any) => s.user_id));
      for (const sub of expiredTrials) {
        await this.chargeSubscription(sub, profileMap[sub.user_id], false);
      }
    }

    // Retry payment_failed (retry_count < 3)
    const { data: failedRetries } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('status', 'payment_failed')
      .lt('retry_count', 3);

    if (failedRetries?.length) {
      const profileMap = await this.loadProfiles(failedRetries.map((s: any) => s.user_id));
      for (const sub of failedRetries) {
        await this.chargeSubscription(sub, profileMap[sub.user_id], true);
      }
    }
  }

  private async chargeSubscription(sub: any, profile: any, isRetry: boolean) {
    try {
      const email = profile?.phone
        ? `${profile.phone.replace(/\D/g, '')}@ajopot.app`
        : `${sub.user_id}@ajopot.app`;
      const authCode = sub.paystack_subscription_code;

      if (!authCode) {
        await this.markPaymentFailed(sub.user_id, sub.retry_count, isRetry);
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
        await this.subscriptionsService.activateSubscription(sub.user_id, sub.plan, json.data.reference);
      } else {
        await this.markPaymentFailed(sub.user_id, sub.retry_count, isRetry);
      }
    } catch (err) {
      this.logger.error(`Charge failed for user ${sub.user_id}: ${err}`);
    }
  }

  private async markPaymentFailed(userId: string, currentRetries: number, isRetry: boolean) {
    const newCount = (currentRetries || 0) + (isRetry ? 1 : 0);
    await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .update({ status: 'payment_failed', retry_count: newCount })
      .eq('user_id', userId);

    if (newCount >= 3) {
      await this.supabase
        .getAdminClient()
        .from('profiles')
        .update({ is_suspended: true })
        .eq('user_id', userId);
    }
  }

  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    const apiUrl = this.config.get<string>('WHATSAPP_API_URL');
    const token = this.config.get<string>('WHATSAPP_API_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID');

    if (!apiUrl || !token || !phoneId) {
      this.logger.warn('WhatsApp API not configured, skipping message to ' + phone);
      return;
    }

    try {
      await fetch(`${apiUrl}/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'text',
          text: { body: message },
        }),
      });
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp to ${phone}: ${err.message}`);
    }
  }
}
