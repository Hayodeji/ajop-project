import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import type { GroupFrequency } from '../group.types'
import { GROUP_FREQUENCIES } from './create-group.dto'

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsInt()
  @Min(100)
  contribution_amount?: number

  @IsOptional()
  @IsEnum(GROUP_FREQUENCIES)
  frequency?: GroupFrequency

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  member_count?: number
}
