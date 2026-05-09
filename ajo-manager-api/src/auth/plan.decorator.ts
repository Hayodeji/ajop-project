import { SetMetadata } from '@nestjs/common'
import { SubscriptionPlan } from '../subscriptions/subscriptions.schema'

export const PLAN_KEY = 'requiredPlan'
export const PlanRequired = (plan: SubscriptionPlan) => SetMetadata(PLAN_KEY, plan)
