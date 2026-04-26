import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionPlan } from './subscriptions.types'

const PLAN_AMOUNTS: Record<SubscriptionPlan, number> = {
  basic: 150000,
  smart: 300000,
  pro: 500000,
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async getMySubscription(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new NotFoundException('Subscription not found')
    return data
  }

  async initiatePayment(userId: string, plan: SubscriptionPlan, userPhone: string) {
    const paystackKey = this.config.get<string>('PAYSTACK_SECRET_KEY')
    if (!paystackKey) throw new BadRequestException('Payment not configured')

    const amount = PLAN_AMOUNTS[plan]
    const digits = (userPhone ?? '').replace(/\D/g, '')
    const email = `${digits || userId}@ajopot.app`
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        email,
        metadata: { user_id: userId, plan, cancel_action: `${frontendUrl}/plan-select` },
        callback_url: `${frontendUrl}/payment/callback`,
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    })

    const json = (await res.json()) as { status: boolean; message: string; data: { authorization_url: string; access_code: string; reference: string } }
    if (!json.status) throw new BadRequestException(json.message ?? 'Failed to initialize payment')
    return json.data
  }

  async verifyAndActivate(userId: string, reference: string) {
    const paystackKey = this.config.get<string>('PAYSTACK_SECRET_KEY')
    if (!paystackKey) throw new BadRequestException('Payment not configured')

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    })

    const json = (await res.json()) as { status: boolean; data: { status: string; metadata: { user_id: string; plan: string }; reference: string } }
    if (!json.status || json.data?.status !== 'success') {
      throw new BadRequestException('Payment verification failed')
    }

    const { user_id, plan } = json.data.metadata ?? {}
    if (user_id !== userId) throw new BadRequestException('User mismatch')

    await this.activateSubscription(userId, plan as SubscriptionPlan, reference)
    return { plan, status: 'active' }
  }

  async activateSubscription(userId: string, plan: SubscriptionPlan, reference?: string) {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    const payload: Record<string, unknown> = {
      plan,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }
    if (reference) payload.paystack_reference = reference

    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await this.supabase
        .getAdminClient()
        .from('subscriptions')
        .update(payload)
        .eq('user_id', userId)
    } else {
      await this.supabase
        .getAdminClient()
        .from('subscriptions')
        .insert({ user_id: userId, ...payload })
    }

    await this.syncProfilePlan(userId, plan)
  }

  async selectPlan(userId: string, plan: SubscriptionPlan) {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const { data, error } = await this.supabase
        .getAdminClient()
        .from('subscriptions')
        .update({ plan, status: 'trial', trial_ends_at: trialEndsAt.toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw new ConflictException(error.message)
      await this.syncProfilePlan(userId, plan)
      return data
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw new ConflictException(error.message)
    await this.syncProfilePlan(userId, plan)
    return data
  }

  private async syncProfilePlan(userId: string, plan: SubscriptionPlan) {
    await this.supabase
      .getAdminClient()
      .from('profiles')
      .update({ plan, is_pro: plan === 'pro' })
      .eq('user_id', userId)
  }

  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const { data } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return 'basic'
    if (data.status === 'trial') return data.plan as SubscriptionPlan
    if (data.status === 'active') {
      if (data.current_period_end && new Date(data.current_period_end) < new Date()) return 'basic'
      return data.plan as SubscriptionPlan
    }
    return 'basic'
  }
}
