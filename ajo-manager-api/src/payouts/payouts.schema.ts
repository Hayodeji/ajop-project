import { ObjectType, Field, ID, Int } from '@nestjs/graphql'

@ObjectType()
export class Payout {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  group_id: string

  @Field(() => ID)
  member_id: string

  @Field(() => Int)
  cycle_number: number

  @Field(() => Int)
  amount: number

  @Field()
  created_at: Date
}
