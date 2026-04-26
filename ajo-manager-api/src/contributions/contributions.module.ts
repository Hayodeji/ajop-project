import { Module } from '@nestjs/common'
import { ContributionsController } from './contributions.controller'
import { ContributionsService } from './contributions.service'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports: [SubscriptionsModule],
  controllers: [ContributionsController],
  providers: [ContributionsService],
})
export class ContributionsModule {}
