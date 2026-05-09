import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsModule } from '../groups/groups.module'
import { MembersModule } from '../members/members.module'
import { ContributionsService } from './contributions.service'
import { ContributionsResolver } from './contributions.resolver'
import { ContributionsRepo } from './contributions.repo'

@Module({
  imports: [AuthModule, SubscriptionsModule, GroupsModule, MembersModule],
  providers: [ContributionsService, ContributionsResolver, ContributionsRepo],
  exports: [ContributionsService, ContributionsRepo],
})
export class ContributionsModule {}
