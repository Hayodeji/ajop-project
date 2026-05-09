import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsService } from './groups.service'
import { GroupsResolver } from './groups.resolver'
import { GroupsRepo } from './groups.repo'

@Module({
  imports: [AuthModule, SubscriptionsModule],
  providers: [GroupsService, GroupsResolver, GroupsRepo],
  exports: [GroupsService, GroupsRepo],
})
export class GroupsModule {}
