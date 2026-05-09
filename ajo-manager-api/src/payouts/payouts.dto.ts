import { InputType, ArgsType, Field, Int, PartialType, ID } from '@nestjs/graphql'
import { IsInt, IsUUID, Min } from 'class-validator'

@ArgsType()
export class PayoutArgs {
  @Field(() => ID)
  @IsUUID()
  id: string
}

@InputType()
export class CreatePayoutInput {
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

  @Field(() => Int)
  @IsInt()
  @Min(100)
  amount: number
}

@InputType()
export class UpdatePayoutInput extends PartialType(CreatePayoutInput) {
  @Field(() => ID)
  @IsUUID()
  id: string
}
