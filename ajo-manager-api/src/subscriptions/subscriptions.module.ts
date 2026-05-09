import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionsResolver } from './subscriptions.resolver'
import { SubscriptionsRepo } from './subscriptions.repo'

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [SubscriptionsService, SubscriptionsResolver, SubscriptionsRepo],
  exports: [SubscriptionsService, SubscriptionsRepo],
})
export class SubscriptionsModule {}
