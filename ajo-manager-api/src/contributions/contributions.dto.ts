import { InputType, ArgsType, Field, Int, PartialType, ID } from '@nestjs/graphql'
import { IsEnum, IsInt, IsUUID, Min } from 'class-validator'
import { ContributionStatus } from './contributions.schema'

@ArgsType()
export class ContributionArgs {
  @Field(() => ID)
  @IsUUID()
  id: string
}

@InputType()
export class CreateContributionInput {
  @Field(() => ID)
  @IsUUID()
  group_id: string

  @Field(() => ID)
  @IsUUID()
  member_id: string

  @Field(() => Int)
  @IsInt()
  @Min(1)
  cycle_number: number

  @Field(() => ContributionStatus)
  @IsEnum(ContributionStatus)
  status: ContributionStatus
}

@InputType()
export class UpdateContributionInput extends PartialType(CreateContributionInput) {
  @Field(() => ID)
  @IsUUID()
  id: string
}
