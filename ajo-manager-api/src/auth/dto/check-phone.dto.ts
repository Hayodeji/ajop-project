import { IsString, Matches } from 'class-validator'

export class CheckPhoneDto {
  @IsString()
  @Matches(/^\+234[0-9]{10}$/, { message: 'Phone must be in +234XXXXXXXXXX format' })
  phone: string
}
