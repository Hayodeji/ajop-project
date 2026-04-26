import { IsString, MaxLength, Matches, IsInt, Min } from 'class-validator'

export class InviteMemberDto {
  @IsString()
  @MaxLength(100)
  name: string

  @IsString()
  @Matches(/^\+234[0-9]{10}$/, { message: 'Phone must be +234XXXXXXXXXX format' })
  phone: string

  @IsInt()
  @Min(1)
  payoutPosition: number
}
