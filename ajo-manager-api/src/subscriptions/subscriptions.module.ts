import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SubscriptionEntity } from '../database/entities/subscription.entity'
import { ProfileEntity } from '../database/entities/profile.entity'
import { NotificationEntity } from '../database/entities/notification.entity'
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionsResolver } from './subscriptions.resolver'
import { SubscriptionsRepo } from './subscriptions.repo'
import { SubscriptionsCron } from './subscriptions.cron'

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity, ProfileEntity, NotificationEntity]), forwardRef(() => AuthModule), WhatsAppModule],
  providers: [SubscriptionsService, SubscriptionsResolver, SubscriptionsRepo, SubscriptionsCron],
  exports: [SubscriptionsService, SubscriptionsRepo],
})
export class SubscriptionsModule {}
