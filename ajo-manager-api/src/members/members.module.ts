import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsModule } from '../groups/groups.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { ContributionsModule } from '../contributions/contributions.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { GroupEntity } from '../database/entities/group.entity'
import { MembersService } from './members.service'
import { MembersResolver } from './members.resolver'
import { MembersRepo } from './members.repo'

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMemberEntity, GroupEntity]),
    AuthModule,
    SubscriptionsModule,
    GroupsModule,
    WhatsAppModule,
    forwardRef(() => ContributionsModule),
  ],
  providers: [MembersService, MembersResolver, MembersRepo],
  exports: [MembersService, MembersRepo],
})
export class MembersModule {}
