import { IsEnum } from 'class-validator'

export class InitiatePaymentDto {
  @IsEnum(['basic', 'smart', 'pro'])
  plan!: 'basic' | 'smart' | 'pro'
}
