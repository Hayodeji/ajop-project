import { Module } from '@nestjs/common'
import { PayoutsController } from './payouts.controller'
import { PayoutsService } from './payouts.service'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports: [SubscriptionsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
