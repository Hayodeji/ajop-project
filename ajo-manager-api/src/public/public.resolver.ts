import { Resolver, Query, Args } from '@nestjs/graphql'
import { PublicService } from './public.service'
import { PublicGroupResponse } from './public.schema'
import { PublicGroupArgs } from './public.dto'

@Resolver()
export class PublicResolver {
  constructor(private readonly publicService: PublicService) {}

  @Query(() => PublicGroupResponse)
  publicGroup(@Args() args: PublicGroupArgs) {
    return this.publicService.getGroupByToken(args.token)
  }
}
