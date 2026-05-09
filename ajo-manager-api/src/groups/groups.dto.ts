import { InputType, ArgsType, Field, Int, PartialType } from '@nestjs/graphql'
import { IsEnum, IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator'
import { GroupFrequency } from './groups.schema'

@ArgsType()
export class GroupArgs {
  @Field()
  @IsUUID()
  id: string
}

@InputType()
export class CreateGroupInput {
  @Field()
  @IsString()
  @MinLength(2)
  name: string

  @Field(() => Int)
  @IsInt()
  @Min(100)
  contribution_amount: number

  @Field(() => GroupFrequency)
  @IsEnum(GroupFrequency)
  frequency: GroupFrequency

  @Field(() => Int)
  @IsInt()
  @Min(2)
  member_count: number
}

@InputType()
export class UpdateGroupInput extends PartialType(CreateGroupInput) {
  @Field()
  @IsUUID()
  id: string
}
