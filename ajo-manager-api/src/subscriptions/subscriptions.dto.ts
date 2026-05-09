import { InputType, Field } from '@nestjs/graphql'
import { IsString, MinLength } from 'class-validator'

@InputType()
export class SelectPlanInput {
  @Field()
  @IsString()
  plan: string
}

@InputType()
export class InitiatePaymentInput {
  @Field()
  @IsString()
  plan: string
}

@InputType()
export class VerifyPaymentInput {
  @Field()
  @IsString()
  @MinLength(1)
  reference: string
}
