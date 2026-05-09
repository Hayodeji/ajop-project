import { ObjectType, Field, ID } from '@nestjs/graphql'

@ObjectType()
export class ReminderLog {
  @Field(() => ID)
  id: string

  @Field()
  sent_at: Date

  @Field()
  recipient: string

  @Field()
  message: string
}
