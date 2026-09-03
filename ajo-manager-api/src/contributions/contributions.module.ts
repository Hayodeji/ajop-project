import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsModule } from '../groups/groups.module'
import { MembersModule } from '../members/members.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContributionEntity } from '../database/entities/contribution.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { ContributionsService } from './contributions.service'
import { ContributionsResolver } from './contributions.resolver'
import { ContributionsRepo } from './contributions.repo'

@Module({
  imports: [
    TypeOrmModule.forFeature([ContributionEntity, GroupMemberEntity]),
    AuthModule,
    SubscriptionsModule,
    GroupsModule,
    forwardRef(() => MembersModule),
    WhatsAppModule,
  ],
  providers: [ContributionsService, ContributionsResolver, ContributionsRepo],
  exports: [ContributionsService, ContributionsRepo],
})
export class ContributionsModule {}
