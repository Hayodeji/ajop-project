import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContributionEntity } from '../database/entities/contribution.entity'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { SubscriptionEntity } from '../database/entities/subscription.entity'
import { RemindersService } from './reminders.service'
import { RemindersRepo } from './reminders.repo'
import { RemindersController } from './reminders.controller'
import { JwtAuthGuard } from '../auth/auth.guard'
import { GroupsModule } from '../groups/groups.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ContributionEntity, GroupEntity, GroupMemberEntity, SubscriptionEntity]),
    GroupsModule,
    WhatsAppModule,
    AuthModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersRepo, JwtAuthGuard],
  exports: [RemindersService],
})
export class RemindersModule {}
