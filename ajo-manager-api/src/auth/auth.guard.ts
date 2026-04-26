import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type { AuthenticatedRequest } from './types'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name)

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('You must sign in to do that.')
    }

    const user = await this.supabase.getUserFromToken(token)
    if (!user) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.')
    }

    request.user = user
    return true
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization
    if (!header) return null
    const [scheme, token] = header.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null
    return token
  }
}
