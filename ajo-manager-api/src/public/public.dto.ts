import { ArgsType, Field } from '@nestjs/graphql'
import { IsString, MinLength } from 'class-validator'

@ArgsType()
export class PublicGroupArgs {
  @Field()
  @IsString()
  @MinLength(1)
  token: string
}
