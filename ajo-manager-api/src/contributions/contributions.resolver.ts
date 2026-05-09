import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { ContributionsService } from './contributions.service'
import { Contribution, ContributionMember } from './contributions.schema'
import { CreateContributionInput } from './contributions.dto'

@Resolver(() => Contribution)
@UseGuards(GqlAuthGuard)
export class ContributionsResolver {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Query(() => [Contribution])
  contributions(
    @CurrentUser() user: User,
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('fromDate', { nullable: true }) fromDate?: string,
    @Args('toDate', { nullable: true }) toDate?: string,
  ) {
    return this.contributionsService.getContributions(groupId, user.id, fromDate, toDate)
  }

  @Mutation(() => Contribution)
  markContribution(
    @CurrentUser() user: User,
    @Args('input') input: CreateContributionInput,
  ) {
    return this.contributionsService.markContribution(user.id, input)
  }

  @ResolveField(() => ContributionMember, { nullable: true })
  member(@Parent() contribution: any) {
    return contribution.group_members || null
  }
}
