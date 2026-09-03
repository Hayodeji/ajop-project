import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from './services/jwt.service'
import type { AuthenticatedRequest } from './types'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context)
    if (!request) return false

    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('You must sign in to do that.')
    }

    const payload = this.jwtService.verifyAccessToken(token)
    if (!payload) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.')
    }

    // Normalize to shape expected elsewhere (many places expect `user.id`)
    request.user = { id: (payload as any).userId ?? (payload as any).id, ...(payload as any) }
    return true
  }

  protected getRequest(context: ExecutionContext): AuthenticatedRequest {
    return context.switchToHttp().getRequest<AuthenticatedRequest>()
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization
    if (!header) return null
    const [scheme, token] = header.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null
    return token
  }
}
