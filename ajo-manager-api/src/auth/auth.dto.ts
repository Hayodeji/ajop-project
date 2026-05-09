import { InputType, Field, ArgsType } from '@nestjs/graphql'
import { IsString, Matches, MinLength, IsOptional } from 'class-validator'

@InputType()
export class CheckPhoneInput {
  @Field()
  @IsString()
  @Matches(/^\+234[0-9]{10}$/, { message: 'Phone must be in +234 format' })
  phone: string
}

@InputType()
export class CompleteProfileInput {
  @Field()
  @IsString()
  @MinLength(2)
  name: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  email?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referralCode?: string
}

@InputType()
export class ForgotPasswordInput {
  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  phone?: string
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  @MinLength(6)
  password: string
}
