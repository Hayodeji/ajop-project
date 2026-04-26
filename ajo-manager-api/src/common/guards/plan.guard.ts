import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseService } from '../../supabase/supabase.service'

export const PLAN_TIERS = { basic: 0, smart: 1, pro: 2 }
export type PlanTier = keyof typeof PLAN_TIERS

export const RequiresPlan = (tier: PlanTier) =>
  Reflect.metadata('requires_plan', tier)

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.get<PlanTier>('requires_plan', ctx.getHandler())
    if (!requiredTier) return true

    const request = ctx.switchToHttp().getRequest()
    const userId = request.user?.id
    if (!userId) return false

    const { data: sub } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (!sub || (sub.status !== 'trial' && sub.status !== 'active')) {
      throw new ForbiddenException('Active subscription required')
    }

    const userTier = PLAN_TIERS[sub.plan as PlanTier] ?? 0
    const required = PLAN_TIERS[requiredTier] ?? 0

    if (userTier < required) {
      throw new ForbiddenException(`This feature requires the ${requiredTier} plan or higher`)
    }

    request.subscription = sub
    return true
  }
}
