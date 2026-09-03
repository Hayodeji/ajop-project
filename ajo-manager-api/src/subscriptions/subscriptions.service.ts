import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsRepo } from './subscriptions.repo';
import { SubscriptionPlan, SubscriptionStatus, PLAN_AMOUNTS, PLAN_GROUP_LIMITS, PLAN_MEMBER_LIMITS } from './subscriptions.schema';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProfileEntity, ProfilePlan } from '../database/entities/profile.entity'

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly subscriptionsRepo: SubscriptionsRepo,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) {}

  private mapSubscription(data: any) {
    if (!data) return null;
    let expires_at = new Date();
    const trialEnds = data.trial_ends_at ?? data.trialEndsAt
    const trial_ends_at = trialEnds ? new Date(trialEnds) : null;
    const currentPeriodEnd = data.current_period_end ?? data.currentPeriodEnd

    if (data.status === 'trialing' && trial_ends_at) {
      expires_at = trial_ends_at;
    } else if (data.status === 'active' && currentPeriodEnd) {
      expires_at = new Date(currentPeriodEnd);
    }

    return {
      ...data,
      trial_ends_at,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      expires_at,
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

    const existing = await this.subscriptionsRepo.findByUserId(userId);
    
    if (existing) {
      await this.subscriptionsRepo.update(userId, payload);
    } else {
      await this.subscriptionsRepo.upsert({ user_id: userId, ...payload });
    }

    await this.syncProfilePlan(userId, plan);
  }

  async selectPlan(userId: string, plan: SubscriptionPlan) {
    const existing = await this.subscriptionsRepo.findByUserId(userId);

    if (existing) {
      const now = new Date();
      let isExpired = true;
      const existingTrial = (existing as any).trial_ends_at ?? (existing as any).trialEndsAt
      const existingPeriodEnd = (existing as any).current_period_end ?? (existing as any).currentPeriodEnd

      if (existing.status === SubscriptionStatus.TRIALING && existingTrial) {
        isExpired = new Date(existingTrial) < now;
      } else if (existing.status === SubscriptionStatus.ACTIVE && existingPeriodEnd) {
        isExpired = new Date(existingPeriodEnd) < now;
      }

      if (!isExpired && (existing.status === SubscriptionStatus.ACTIVE || existing.status === SubscriptionStatus.TRIALING)) {
        throw new BadRequestException('Cannot change plan while your current subscription is still active.');
      }

      const data = await this.subscriptionsRepo.update(userId, { plan });
      await this.syncProfilePlan(userId, plan);
      return this.mapSubscription(data);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

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
      const profile = await this.profileRepo.findOne({ where: { userId } })
      if (profile?.email) email = profile.email
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
    await this.profileRepo.update({ userId }, { plan: plan as unknown as ProfilePlan, isPro: plan === 'pro' })
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

    const customGroup  = (data as any)?.custom_group_limit ?? (data as any)?.customGroupLimit ?? null;
    const customMember = (data as any)?.custom_member_limit ?? (data as any)?.customMemberLimit ?? null;

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
      const currentPeriodEnd = (data as any).current_period_end ?? (data as any).currentPeriodEnd
      if (
        currentPeriodEnd &&
        new Date(currentPeriodEnd) < new Date()
      )
        return SubscriptionPlan.BASIC;
      return data.plan as SubscriptionPlan;
    }
    return SubscriptionPlan.BASIC;
  }
}
