import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common'
import * as crypto from 'crypto'
import type { Request } from 'express'
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto'
import { SupabaseService } from '../supabase/supabase.service'
import { ConfigService } from '@nestjs/config'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'

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
    @Body() body: { event: string; data: { status: string; reference: string; metadata: { user_id: string; plan: string } } },
  ) {
    try {
      const secret = this.config.get<string>('PAYSTACK_SECRET_KEY') ?? ''
      if (secret && req.rawBody) {
        const hash = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex')
        if (hash !== signature) return { status: 'invalid signature' }
      }

      if (body?.event === 'charge.success' && body.data?.status === 'success') {
        const { user_id, plan } = body.data.metadata ?? {}
        if (user_id && plan) {
          await this.subscriptions.activateSubscription(
            user_id,
            plan as 'basic' | 'smart' | 'pro',
            body.data.reference,
          )
        }
      }
    } catch {
      // Webhook errors must not throw — Paystack retries on non-200
    }
    return { status: 'ok' }
  }
}
