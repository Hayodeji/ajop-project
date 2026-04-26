import { IsString, MaxLength, IsOptional, Matches } from 'class-validator'

export class CompleteProfileDto {
  @IsString()
  @MaxLength(100)
  name: string

  @IsString()
  @IsOptional()
  @Matches(/^\+234[0-9]{10}$/, { message: 'Phone must be in +234XXXXXXXXXX format' })
  phone?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  referralCode?: string
}
