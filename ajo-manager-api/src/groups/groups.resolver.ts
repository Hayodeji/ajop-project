import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { GqlAuthGuard } from '../auth/gql-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { GroupsService } from './groups.service'
import { Group } from './groups.schema'
import { CreateGroupInput, UpdateGroupInput, GroupArgs } from './groups.dto'

@Resolver(() => Group)
@UseGuards(GqlAuthGuard)
export class GroupsResolver {
  constructor(private readonly groupsService: GroupsService) {}

  @Mutation(() => Group)
  createGroup(
    @CurrentUser() user: User,
    @Args('input') input: CreateGroupInput,
  ) {
    return this.groupsService.create(user.id, input)
  }

  @Query(() => [Group])
  groups(@CurrentUser() user: User) {
    return this.groupsService.findAllForAdmin(user.id)
  }

  @Query(() => Group)
  group(
    @CurrentUser() user: User,
    @Args() args: GroupArgs,
  ) {
    return this.groupsService.findOne(user.id, args.id)
  }

  @Mutation(() => Group)
  updateGroup(
    @CurrentUser() user: User,
    @Args('input') input: UpdateGroupInput,
  ) {
    return this.groupsService.update(user.id, input.id, input)
  }

  @Mutation(() => Boolean)
  removeGroup(
    @CurrentUser() user: User,
    @Args() args: GroupArgs,
  ) {
    return this.groupsService.remove(user.id, args.id)
  }
}
