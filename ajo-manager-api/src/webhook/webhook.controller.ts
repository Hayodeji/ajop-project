import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common'
import * as crypto from 'crypto'
import type { Request } from 'express'
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto'
import { SupabaseService } from '../supabase/supabase.service'
import { ConfigService } from '@nestjs/config'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { SubscriptionPlan } from '../subscriptions/subscriptions.schema'

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // WhatsApp webhook verification
  @Get('whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN') ?? 'ajopot_verify'
    if (mode === 'subscribe' && token === verifyToken) return parseInt(challenge)
    return 'Forbidden'
  }

  @Post('whatsapp')
  async receiveMessage(@Body() body: WhatsappWebhookDto) {
    try {
      const messages = body.entry?.[0]?.changes?.[0]?.value?.messages ?? []
      for (const msg of messages) {
        if (msg.type === 'text') {
          const text: string = msg.text?.body?.toLowerCase() ?? ''
          if (text.includes('paid') || text.includes('done') || text.includes('sent')) {
            await this.supabase.getAdminClient().from('contributions').select('id').limit(1)
          }
        }
      }
    } catch {
      // Webhook errors must not throw — WhatsApp retries on non-200
    }
    return { status: 'ok' }
  }

  @Post('paystack')
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: { event: string; data: any },
  ) {
    try {
      const secret = this.config.get<string>('PAYSTACK_SECRET_KEY') ?? ''
      if (secret && req.rawBody) {
        const hash = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex')
        if (hash !== signature) return { status: 'invalid signature' }
      }

      await this.supabase.getAdminClient().from('payment_events').insert({
        event_type: body?.event ?? 'unknown',
        paystack_reference: body?.data?.reference,
        user_id: body?.data?.metadata?.user_id,
        payload: body,
      })

      const event = body?.event
      const data = body?.data
      const user_id = data?.metadata?.user_id
      const plan = data?.metadata?.plan

      if (event === 'charge.success' && data?.status === 'success') {
        if (user_id && plan) {
          await this.subscriptions.activateSubscription(
            user_id,
            plan as SubscriptionPlan,
            data.reference,
          )
        }
      } else if (event === 'charge.failed' || event === 'invoice.payment_failed') {
        if (user_id) {
          const { data: sub } = await this.supabase
            .getAdminClient()
            .from('subscriptions')
            .select('retry_count')
            .eq('user_id', user_id)
            .single()

          const retries = (sub?.retry_count ?? 0) + 1
          await this.supabase
            .getAdminClient()
            .from('subscriptions')
            .update({ status: 'payment_failed', retry_count: retries })
            .eq('user_id', user_id)
        }
      } else if (event === 'subscription.disable') {
        // Find by customer code or email if user_id is missing
        let targetUser = user_id
        if (!targetUser && data?.customer?.customer_code) {
           const { data: c } = await this.supabase
             .getAdminClient()
             .from('subscriptions')
             .select('user_id')
             .eq('paystack_customer_code', data.customer.customer_code)
             .maybeSingle()
           if (c) targetUser = c.user_id
        }
        
        if (targetUser) {
          await this.supabase
            .getAdminClient()
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', targetUser)
        }
      }
    } catch (err) {
      // Webhook errors must not throw — Paystack retries on non-200
    }
    return { status: 'ok' }
  }
}
