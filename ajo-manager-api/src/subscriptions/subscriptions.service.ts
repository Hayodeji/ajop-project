import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { SubscriptionsRepo } from './subscriptions.repo';
import { SubscriptionPlan, SubscriptionStatus, PLAN_AMOUNTS } from './subscriptions.schema';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly subscriptionsRepo: SubscriptionsRepo,
  ) {}

  private mapSubscription(data: any) {
    if (!data) return null;
    let expires_at = new Date();
    const trial_ends_at = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    
    if (data.status === 'trialing' && trial_ends_at) {
      expires_at = trial_ends_at;
    } else if (data.status === 'active' && data.current_period_end) {
      expires_at = new Date(data.current_period_end);
    }
    
    return { 
      ...data, 
      trial_ends_at,
      expires_at 
    };
  }

  async getMySubscription(userId: string) {
    const data = await this.subscriptionsRepo.findByUserId(userId);
    return this.mapSubscription(data);
  }

  async activateTrial(
    userId: string,
    plan: SubscriptionPlan,
    reference?: string,
    customerCode?: string,
    authCode?: string,
  ) {
    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 7);

    const payload: Record<string, unknown> = {
      plan,
      status: SubscriptionStatus.TRIALING,
      trial_ends_at: trialEnds.toISOString(),
      current_period_start: null,
      current_period_end: null,
    };
    if (reference) payload.paystack_reference = reference;
    if (customerCode) payload.paystack_customer_code = customerCode;
    if (authCode) payload.paystack_subscription_code = authCode;

    await this.subscriptionsRepo.upsert({ user_id: userId, ...payload });
    await this.syncProfilePlan(userId, plan);
  }

  async activateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    reference?: string,
  ) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const payload: Record<string, unknown> = {
      plan,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    };
    if (reference) payload.paystack_reference = reference;

    await this.subscriptionsRepo.upsert({ user_id: userId, ...payload });
    await this.syncProfilePlan(userId, plan);
  }

  async selectPlan(userId: string, plan: SubscriptionPlan) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    try {
      const data = await this.subscriptionsRepo.upsert({
        user_id: userId,
        plan,
        status: SubscriptionStatus.TRIALING,
        trial_ends_at: trialEndsAt.toISOString()
      });
      await this.syncProfilePlan(userId, plan);
      return this.mapSubscription(data);
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  async initiatePayment(userId: string, plan: SubscriptionPlan, fallbackEmail: string) {
    const amount = PLAN_AMOUNTS[plan]
    if (!amount) throw new BadRequestException('Invalid plan selection.')

    let email = fallbackEmail
    try {
      const { data } = await this.supabase.getAdminClient().auth.admin.getUserById(userId)
      if (data?.user?.email) {
        email = data.user.email
      }
    } catch (e) {
      this.logger.warn(`Could not fetch fresh user email for ${userId}`)
    }

    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY')
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount,
          callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
          metadata: { user_id: userId, plan },
        },
        {
          headers: { Authorization: `Bearer ${secret}` },
        },
      )

      return {
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
        access_code: response.data.data.access_code,
      }
    } catch (error) {
      this.logger.error(`Paystack init failed: ${error.response?.data?.message || error.message}`)
      throw new BadRequestException('Could not initiate payment.')
    }
  }

  async verifyAndActivate(userId: string, reference: string) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY')
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
        },
      )

      const data = response.data.data
      if (data.status !== 'success') {
        throw new BadRequestException(`Payment not successful. Status: ${data.status}`)
      }
      
      if (data.metadata?.user_id !== userId) {
        throw new BadRequestException(`User mismatch. Expected ${userId}, got ${data.metadata?.user_id}`)
      }

      await this.activateSubscription(userId, data.metadata.plan as SubscriptionPlan, reference)
      const sub = await this.subscriptionsRepo.findByUserId(userId)
      return this.mapSubscription(sub)
    } catch (error) {
      const msg = error instanceof BadRequestException 
        ? error.message 
        : `Paystack verify failed: ${error.response?.data?.message || error.message}`
      this.logger.error(msg)
      throw new BadRequestException(msg)
    }
  }

  private async syncProfilePlan(userId: string, plan: SubscriptionPlan) {
    await this.supabase
      .getAdminClient()
      .from('profiles')
      .update({ plan, is_pro: plan === 'pro' })
      .eq('user_id', userId);
  }

  /**
   * Returns the effective group/member limits for a user.
   * Custom overrides set by super-admins take priority over plan defaults.
   */
  async getEffectiveLimits(userId: string): Promise<{
    groupLimit: number
    memberLimit: number
    isGroupLimitCustom: boolean
    isMemberLimitCustom: boolean
  }> {
    const data = await this.subscriptionsRepo.findByUserId(userId);
    const plan = await this.getUserPlan(userId);

    const planGroupDefault = PLAN_GROUP_LIMITS[plan] ?? PLAN_GROUP_LIMITS['basic'];
    const planMemberDefault = PLAN_MEMBER_LIMITS[plan] ?? PLAN_MEMBER_LIMITS['basic'];

    const customGroup  = (data as any)?.custom_group_limit  ?? null;
    const customMember = (data as any)?.custom_member_limit ?? null;

    return {
      groupLimit:          customGroup  !== null ? customGroup  : planGroupDefault,
      memberLimit:         customMember !== null ? customMember : planMemberDefault,
      isGroupLimitCustom:  customGroup  !== null,
      isMemberLimitCustom: customMember !== null,
    };
  }

  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const data = await this.subscriptionsRepo.findByUserId(userId);

    if (!data) return SubscriptionPlan.BASIC;
    if (data.status === SubscriptionStatus.TRIALING) return data.plan as SubscriptionPlan;
    if (data.status === SubscriptionStatus.ACTIVE) {
      if (
        data.current_period_end &&
        new Date(data.current_period_end) < new Date()
      )
        return SubscriptionPlan.BASIC;
      return data.plan as SubscriptionPlan;
    }
    return SubscriptionPlan.BASIC;
  }
}
