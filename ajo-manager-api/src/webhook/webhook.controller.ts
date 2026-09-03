import { Body, Controller, Get, Headers, Post, Query, Req, Logger } from '@nestjs/common'
import * as crypto from 'crypto'
import type { Request } from 'express'
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto'
import { ConfigService } from '@nestjs/config'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { SubscriptionPlan, SubscriptionStatus } from '../subscriptions/subscriptions.schema'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaymentEventEntity } from '../database/entities/payment-event.entity'
import { SubscriptionsRepo } from '../subscriptions/subscriptions.repo'

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)

  constructor(
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventsRepo: Repository<PaymentEventEntity>,
    private readonly config: ConfigService,
    private readonly subscriptions: SubscriptionsService,
    private readonly subscriptionsRepo: SubscriptionsRepo,
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
            // no-op placeholder: contributions check removed during supabase removal
            this.logger.debug('WhatsApp message looks like a payment — no DB action')
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

      // persist payment event via TypeORM
      const ev = this.paymentEventsRepo.create({
        eventType: body?.event ?? 'unknown',
        paystackReference: body?.data?.reference,
        userId: body?.data?.metadata?.user_id,
        payload: body,
      })
      await this.paymentEventsRepo.save(ev)

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
          const sub = await this.subscriptionsRepo.findByUserId(user_id)
          const retries = (sub?.retryCount ?? 0) + 1
          await this.subscriptionsRepo.update(user_id, { status: SubscriptionStatus.PAYMENT_FAILED, retryCount: retries })
        }
      } else if (event === 'subscription.disable') {
        // Find by customer code or email if user_id is missing
        let targetUser = user_id
        if (!targetUser && data?.customer?.customer_code) {
          const found = await this.subscriptionsRepo.findByUserId(data.customer.customer_code)
          if (found) targetUser = (found as any).userId || (found as any).user_id
        }

        if (targetUser) {
          await this.subscriptionsRepo.update(targetUser, { status: 'cancelled' })
        }
      }
    } catch (err) {
      // Webhook errors must not throw — Paystack retries on non-200
    }
    return { status: 'ok' }
  }
}
