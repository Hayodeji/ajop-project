import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name)
  private readonly admin: SupabaseClient
  private readonly anon: SupabaseClient

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')

    const clientOptions = {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url: string, options: any) =>
          fetch(url, {
            ...options,
            signal: (AbortSignal as any).timeout(30000), // 30s timeout
          }),
      },
    }

    this.admin = createClient(url, serviceRoleKey, clientOptions)
    this.anon = createClient(url, anonKey, clientOptions)
  }

  getAdminClient(): SupabaseClient {
    return this.admin
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await this.anon.auth.getUser(token)
      if (error) {
        this.logger.debug(`Token verification failed: ${error.message}`)
        return null
      }
      return data.user
    } catch (err: any) {
      this.logger.error(`Supabase connection error: ${err.message}`)
      if (err.cause) {
        this.logger.error(`Cause: ${err.cause}`)
      }
      return null
    }
  }
}
