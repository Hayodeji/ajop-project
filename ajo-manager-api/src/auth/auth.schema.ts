import { ObjectType, Field, ID } from '@nestjs/graphql'

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string

  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  phone?: string

  @Field({ nullable: true })
  avatar_url?: string

  @Field()
  created_at: Date
}

@ObjectType()
export class AuthResponse {
  @Field()
  success: boolean

  @Field({ nullable: true })
  message?: string
}
