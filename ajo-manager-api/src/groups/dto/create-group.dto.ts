import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import type { GroupFrequency } from '../group.types'

export const GROUP_FREQUENCIES: readonly GroupFrequency[] = [
  'weekly',
  'biweekly',
  'monthly',
]

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group name is required.' })
  @MaxLength(100, { message: 'Group name must be 100 characters or fewer.' })
  name!: string

  @IsInt({ message: 'Contribution amount must be a whole number in kobo.' })
  @Min(100, { message: 'Contribution amount must be at least ₦1.' })
  contribution_amount!: number

  @IsEnum(GROUP_FREQUENCIES, {
    message: 'Frequency must be weekly, biweekly, or monthly.',
  })
  frequency!: GroupFrequency

  @IsInt({ message: 'Member count must be a whole number.' })
  @Min(2, { message: 'A group needs at least 2 members.' })
  @Max(100, { message: 'A group can have at most 100 members.' })
  member_count!: number
}
