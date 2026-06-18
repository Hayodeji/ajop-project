import { ObjectType, Field, ID, Int } from '@nestjs/graphql'

@ObjectType()
export class Member {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  group_id: string

  @Field()
  name: string

  @Field()
  phone: string

  @Field(() => Int)
  payout_position: number

  @Field(() => Int)
  outstanding_fines: number

  @Field(() => Boolean)
  is_active: boolean

  @Field()
  joined_at: Date

  @Field({ nullable: true })
  bank_name?: string

  @Field({ nullable: true })
  account_number?: string

  @Field({ nullable: true })
  account_name?: string
}
