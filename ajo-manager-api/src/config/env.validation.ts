import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment

  @IsNumber()
  PORT!: number

  @IsUrl({ require_tld: false })
  SUPABASE_URL!: string

  @IsString()
  @IsNotEmpty()
  SUPABASE_ANON_KEY!: string

  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_ROLE_KEY!: string

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string

  @IsOptional()
  @IsString()
  WHATSAPP_API_URL: string = ''

  @IsOptional()
  @IsString()
  WHATSAPP_API_TOKEN: string = ''

  @IsOptional()
  @IsString()
  WHATSAPP_PHONE_ID: string = ''

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_BUCKET: string = 'receipts'

  @IsOptional()
  @IsString()
  SUPER_ADMIN_PHONES: string = '+2349065543761,+2347033139259'

  @IsOptional()
  @IsString()
  PAYSTACK_SECRET_KEY: string = ''

  @IsOptional()
  @IsString()
  FRONTEND_URL: string = 'http://localhost:5173'
}

export function validateEnv(config: Record<string, unknown>) {
  const parsed = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(parsed, { skipMissingProperties: false })
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => e.toString()).join('\n')}`,
    )
  }
  return parsed
}
