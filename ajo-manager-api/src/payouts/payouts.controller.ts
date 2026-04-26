import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { PayoutsService } from './payouts.service'
import { RecordPayoutDto } from './dto/record-payout.dto'
import { SupabaseAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '@supabase/supabase-js'

@Controller('groups/:groupId/payouts')
@UseGuards(SupabaseAuthGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  getPayouts(@Param('groupId') groupId: string, @CurrentUser() user: User) {
    return this.payoutsService.getPayouts(groupId, user.id)
  }

  @Post()
  recordPayout(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
    @Body() dto: RecordPayoutDto,
  ) {
    return this.payoutsService.recordPayout(groupId, user.id, dto)
  }
}
