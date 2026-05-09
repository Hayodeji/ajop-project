import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsModule } from '../groups/groups.module'
import { MembersService } from './members.service'
import { MembersResolver } from './members.resolver'
import { MembersRepo } from './members.repo'

@Module({
  imports: [AuthModule, SubscriptionsModule, GroupsModule],
  providers: [MembersService, MembersResolver, MembersRepo],
  exports: [MembersService, MembersRepo],
})
export class MembersModule {}
