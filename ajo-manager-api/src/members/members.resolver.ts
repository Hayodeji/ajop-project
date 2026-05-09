import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { MembersService } from './members.service'
import { Member } from './members.schema'
import { CreateMemberInput, UpdateMemberInput, MemberArgs } from './members.dto'

@Resolver(() => Member)
@UseGuards(GqlAuthGuard)
export class MembersResolver {
  constructor(private readonly membersService: MembersService) {}

  @Mutation(() => Member)
  inviteMember(
    @CurrentUser() user: User,
    @Args('input') input: CreateMemberInput,
  ) {
    return this.membersService.inviteMember(user.id, input)
  }

  @Query(() => [Member])
  members(
    @CurrentUser() user: User,
    @Args('groupId', { type: () => ID }) groupId: string,
  ) {
    return this.membersService.getMembers(groupId, user.id)
  }

  @Mutation(() => Member)
  updateMember(
    @CurrentUser() user: User,
    @Args('input') input: UpdateMemberInput,
  ) {
    return this.membersService.updateMember(user.id, input)
  }

  @Mutation(() => Boolean)
  removeMember(
    @CurrentUser() user: User,
    @Args() args: MemberArgs,
  ) {
    return this.membersService.removeMember(user.id, args.id)
  }
}
