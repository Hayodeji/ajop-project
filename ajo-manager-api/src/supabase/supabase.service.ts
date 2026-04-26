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

    this.admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    this.anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  getAdminClient(): SupabaseClient {
    return this.admin
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const { data, error } = await this.anon.auth.getUser(token)
    if (error) {
      this.logger.debug(`Token verification failed: ${error.message}`)
      return null
    }
    return data.user
  }
}
