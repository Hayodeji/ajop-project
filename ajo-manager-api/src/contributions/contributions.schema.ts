import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql'

export enum ContributionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  LATE = 'late',
}

registerEnumType(ContributionStatus, {
  name: 'ContributionStatus',
})

@ObjectType()
export class ContributionMember {
  @Field()
  name: string

  @Field()
  phone: string

  @Field(() => Int, { nullable: true })
  payout_position?: number
}

@ObjectType()
export class Contribution {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  group_id: string

  @Field(() => ID)
  member_id: string

  @Field(() => Int)
  cycle_number: number

  @Field(() => ContributionStatus)
  status: ContributionStatus

  @Field({ nullable: true })
  paid_at?: Date

  @Field({ nullable: true })
  marked_by?: string

  @Field()
  due_date: Date

  @Field()
  created_at: Date

  @Field(() => ContributionMember, { nullable: true })
  member?: ContributionMember
}
