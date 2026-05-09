import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql'

export enum GroupFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

registerEnumType(GroupFrequency, {
  name: 'GroupFrequency',
  description: 'The frequency of contributions for a group',
})

@ObjectType()
export class RotationScheduleItem {
  @Field(() => Int)
  position: number

  @Field()
  member_name: string

  @Field(() => Int)
  collects_on_cycle: number
}

@ObjectType()
export class Group {
  @Field(() => ID)
  id: string

  @Field(() => ID)
  admin_id: string

  @Field()
  name: string

  @Field(() => Int)
  contribution_amount: number

  @Field(() => Int)
  late_fee_amount: number

  @Field(() => GroupFrequency)
  frequency: GroupFrequency

  @Field(() => Int)
  member_count: number

  @Field(() => Int)
  current_cycle: number

  @Field()
  public_token: string

  @Field()
  created_at: Date

  @Field(() => [RotationScheduleItem], { nullable: true })
  rotation_schedule?: RotationScheduleItem[]
}
