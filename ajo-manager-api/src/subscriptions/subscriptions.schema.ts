import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql'

export enum SubscriptionPlan {
  BASIC = 'basic',
  SMART = 'smart',
  PRO = 'pro',
}

export const PLAN_AMOUNTS: Record<string, number> = {
  basic: 150000,
  smart: 300000,
  pro: 500000,
}

export const PLAN_GROUP_LIMITS: Record<string, number> = {
  basic: 1,
  smart: 5,
  pro: 20,
}

export const PLAN_MEMBER_LIMITS: Record<string, number> = {
  basic: 10,
  smart: 30,
  pro: 100,
}

registerEnumType(SubscriptionPlan, {
  name: 'SubscriptionPlan',
})

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'payment_failed',
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
})

@ObjectType()
export class Subscription {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  user_id: string

  @Field(() => SubscriptionPlan)
  plan: SubscriptionPlan

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus

  @Field({ nullable: true })
  trial_ends_at?: Date

  @Field()
  expires_at: Date

  @Field()
  created_at: Date
}

@ObjectType()
export class PaymentInitiationResponse {
  @Field()
  authorization_url: string

  @Field()
  reference: string
}
