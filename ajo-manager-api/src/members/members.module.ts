import { Module } from '@nestjs/common'
import { MembersController } from './members.controller'
import { MembersService } from './members.service'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports: [SubscriptionsModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
