import { ObjectType, Field } from '@nestjs/graphql'
import { Group } from '../groups/groups.schema'
import { Member } from '../members/members.schema'
import { Contribution } from '../contributions/contributions.schema'

@ObjectType()
export class PublicMember extends Member {
  @Field()
  phone: string
}

@ObjectType()
export class PublicGroupResponse {
  @Field(() => Group)
  group: Group

  @Field(() => [PublicMember])
  members: PublicMember[]

  @Field(() => [Contribution])
  contributions: Contribution[]
}
