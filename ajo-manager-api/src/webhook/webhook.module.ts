import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WebhookController } from './webhook.controller'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { PaymentEventEntity } from '../database/entities/payment-event.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEventEntity]), SubscriptionsModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
