import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { GroupsModule } from '../groups/groups.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PayoutEntity } from '../database/entities/payout.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { PayoutsService } from './payouts.service'
import { PayoutsResolver } from './payouts.resolver'
import { PayoutsRepo } from './payouts.repo'

import { MembersModule } from '../members/members.module'

@Module({
  imports: [TypeOrmModule.forFeature([PayoutEntity, GroupMemberEntity]), AuthModule, GroupsModule, MembersModule],
  providers: [PayoutsService, PayoutsResolver, PayoutsRepo],
  exports: [PayoutsService],
})
export class PayoutsModule {}
