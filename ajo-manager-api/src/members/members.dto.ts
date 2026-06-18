import { InputType, ArgsType, Field, Int, PartialType, ID } from '@nestjs/graphql'
import { IsInt, IsString, IsUUID, Matches, Min, MinLength } from 'class-validator'

@ArgsType()
export class MemberArgs {
  @Field(() => ID)
  @IsUUID()
  id: string
}

@InputType()
export class CreateMemberInput {
  @Field(() => ID)
  @IsUUID()
  group_id: string

  @Field()
  @IsString()
  @MinLength(1)
  name: string

  @Field()
  @IsString()
  @Matches(/^\+234[0-9]{10}$/, { message: 'Phone must be in +234 format' })
  phone: string

  @Field(() => Int)
  @IsInt()
  @Min(1)
  payout_position: number

  @Field({ nullable: true })
  @IsString()
  bank_name?: string

  @Field({ nullable: true })
  @IsString()
  account_number?: string

  @Field({ nullable: true })
  @IsString()
  account_name?: string
}

@InputType()
export class UpdateMemberInput extends PartialType(CreateMemberInput) {
  @Field(() => ID)
  @IsUUID()
  id: string
}
