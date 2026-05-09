import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { PayoutsService } from './payouts.service'
import { Payout } from './payouts.schema'
import { CreatePayoutInput } from './payouts.dto'
import { MembersService } from '../members/members.service'

@Resolver(() => Payout)
@UseGuards(GqlAuthGuard)
export class PayoutsResolver {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly membersService: MembersService,
  ) {}

  @Query(() => [Payout])
  payouts(
    @CurrentUser() user: User,
    @Args('groupId', { type: () => ID }) groupId: string,
  ) {
    return this.payoutsService.getPayouts(groupId, user.id)
  }

  @Mutation(() => Payout)
  recordPayout(
    @CurrentUser() user: User,
    @Args('input') input: CreatePayoutInput,
  ) {
    return this.payoutsService.recordPayout(user.id, input)
  }

  @ResolveField()
  async member(@Parent() payout: Payout, @CurrentUser() user: User) {
    const members = await this.membersService.getMembers(payout.group_id, user.id)
    return members.find(m => m.id === payout.member_id)
  }
}
