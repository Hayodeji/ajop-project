import { IsString, IsInt, IsNumber, Min } from 'class-validator'

export class RecordPayoutDto {
  @IsString()
  memberId: string

  @IsInt()
  @Min(1)
  cycleNumber: number

  @IsNumber()
  @Min(1)
  amount: number
}
