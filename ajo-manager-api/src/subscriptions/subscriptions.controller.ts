import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
import { SelectPlanDto } from './dto/select-plan.dto'
import { InitiatePaymentDto } from './dto/initiate-payment.dto'
import { VerifyPaymentDto } from './dto/verify-payment.dto'
import { SupabaseAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '@supabase/supabase-js'

@Controller('subscriptions')
@UseGuards(SupabaseAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.getMySubscription(user.id)
  }

  @Post('select')
  selectPlan(@CurrentUser() user: User, @Body() dto: SelectPlanDto) {
    return this.subscriptionsService.selectPlan(user.id, dto.plan)
  }

  @Post('pay')
  initiatePayment(@CurrentUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.subscriptionsService.initiatePayment(user.id, dto.plan, user.phone ?? '')
  }

  @Post('verify')
  verifyPayment(@CurrentUser() user: User, @Body() dto: VerifyPaymentDto) {
    return this.subscriptionsService.verifyAndActivate(user.id, dto.reference)
  }
}
