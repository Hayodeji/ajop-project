import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { GroupsService } from './groups.service'
import { GroupsResolver } from './groups.resolver'
import { GroupsRepo } from './groups.repo'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity, GroupMemberEntity]),
    AuthModule,
    SubscriptionsModule,
  ],
  providers: [GroupsService, GroupsResolver, GroupsRepo],
  exports: [GroupsService, GroupsRepo],
})
export class GroupsModule {}
