import * as path from 'path'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? `${fallback}`, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function isPlaceholder(value: string | undefined): boolean {
  return !value || value.includes('YOUR_') || value.includes('your-') || value.includes('your_')
}

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const configuredHost = configService.get<string>('DB_HOST')?.trim()
  const configuredPort = configService.get<string>('DB_PORT')
  const configuredUser = configService.get<string>('DB_USER')?.trim()
  const configuredPass = configService.get<string>('DB_PASS')?.trim()
  const configuredName = configService.get<string>('DB_NAME')?.trim()

  const shouldUseLocalFallback =
    isPlaceholder(configuredHost) ||
    isPlaceholder(configuredUser) ||
    isPlaceholder(configuredPass) ||
    isPlaceholder(configuredName) ||
    (configuredHost?.includes('supabase') ?? false)

  const host = shouldUseLocalFallback ? 'localhost' : configuredHost || 'localhost'
  const port = shouldUseLocalFallback ? 5432 : parsePort(configuredPort, 5432)
  const username = shouldUseLocalFallback ? 'postgres' : configuredUser || 'postgres'
  const password = shouldUseLocalFallback ? 'postgres' : configuredPass || 'postgres'
  const database = shouldUseLocalFallback ? 'ajopot' : configuredName || 'ajopot'
  const ssl = configuredHost?.includes('supabase') && !shouldUseLocalFallback ? { rejectUnauthorized: false } : false

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '../../db/migrations/*{.ts,.js}')],
    migrationsTableName: '_migrations',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    logger: 'advanced-console',
    ssl,
  }
}
