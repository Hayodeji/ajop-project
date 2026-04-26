import { IsEnum, IsInt, IsString, Min } from 'class-validator'
import { ContributionStatus } from '../contributions.types'

export class MarkContributionDto {
  @IsString()
  memberId: string

  @IsInt()
  @Min(1)
  cycleNumber: number

  @IsEnum(['paid', 'late', 'pending'])
  status: ContributionStatus
}
