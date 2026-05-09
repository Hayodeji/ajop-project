import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { SubscriptionsService } from './subscriptions.service'
import { Subscription, PaymentInitiationResponse } from './subscriptions.schema'
import { SelectPlanInput, InitiatePaymentInput, VerifyPaymentInput } from './subscriptions.dto'

@Resolver(() => Subscription)
@UseGuards(GqlAuthGuard)
export class SubscriptionsResolver {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Query(() => Subscription, { nullable: true })
  mySubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.getMySubscription(user.id)
  }

  @Mutation(() => Subscription)
  selectPlan(
    @CurrentUser() user: User,
    @Args('input') input: SelectPlanInput,
  ) {
    return this.subscriptionsService.selectPlan(user.id, input.plan as any)
  }

  @Mutation(() => PaymentInitiationResponse)
  initiatePayment(
    @CurrentUser() user: User,
    @Args('input') input: InitiatePaymentInput,
  ) {
    const email = user.email || `${user.id}@ajopot.local`
    return this.subscriptionsService.initiatePayment(user.id, input.plan as any, email)
  }

  @Mutation(() => Subscription)
  verifyPayment(
    @CurrentUser() user: User,
    @Args('input') input: VerifyPaymentInput,
  ) {
    return this.subscriptionsService.verifyAndActivate(user.id, input.reference)
  }

}
