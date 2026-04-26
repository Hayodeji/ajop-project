import { IsEnum } from 'class-validator'
import { SubscriptionPlan } from '../subscriptions.types'

export class SelectPlanDto {
  @IsEnum(['basic', 'smart', 'pro'])
  plan: SubscriptionPlan
}
