import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../../supabase/supabase.service'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(ctx)
    const request = gqlCtx.getContext().req || ctx.switchToHttp().getRequest()

    if (!request?.headers) throw new ForbiddenException('Invalid request context')
    const authHeader: string = (request.headers['authorization'] as string) ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) throw new ForbiddenException('No token provided')

    const user = await this.supabase.getUserFromToken(token)
    if (!user) throw new ForbiddenException('Invalid token')

    const strip = (p: string) => p.replace(/^\+/, '').trim()

    const allowedPhones = (this.config.get<string>('SUPER_ADMIN_PHONES') ?? '')
      .split(',')
      .map(strip)
      .filter(Boolean)

    const userPhone = strip(user.phone ?? '')
    if (!allowedPhones.includes(userPhone)) {
      throw new ForbiddenException('Super-admin access only')
    }

    request.user = user
    return true
  }
}
