import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { SuperAdminGuard } from '../common/guards/super-admin.guard'
import { AuthModule } from '../auth/auth.module'
import { ProfileEntity } from '../database/entities/profile.entity'
import { GroupEntity } from '../database/entities/group.entity'
import { SubscriptionEntity } from '../database/entities/subscription.entity'
import { ContributionEntity } from '../database/entities/contribution.entity'
import { PayoutEntity } from '../database/entities/payout.entity'
import { NotificationEntity } from '../database/entities/notification.entity'
import { AuditLogEntity } from '../database/entities/audit-log.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfileEntity,
      GroupEntity,
      SubscriptionEntity,
      ContributionEntity,
      PayoutEntity,
      NotificationEntity,
      AuditLogEntity,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminGuard],
})
export class AdminModule {}
