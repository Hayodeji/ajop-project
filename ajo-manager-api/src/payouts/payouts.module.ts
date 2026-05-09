import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { GroupsModule } from '../groups/groups.module'
import { PayoutsService } from './payouts.service'
import { PayoutsResolver } from './payouts.resolver'
import { PayoutsRepo } from './payouts.repo'

@Module({
  imports: [AuthModule, GroupsModule],
  providers: [PayoutsService, PayoutsResolver, PayoutsRepo],
  exports: [PayoutsService],
})
export class PayoutsModule {}
