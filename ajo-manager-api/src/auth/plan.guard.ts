import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { PLAN_KEY } from './plan.decorator'
import { SubscriptionPlan } from '../subscriptions/subscriptions.schema'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'

const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  basic: 1,
  smart: 2,
  pro: 3,
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<SubscriptionPlan>(
      PLAN_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPlan) {
      return true
    }

    const gqlCtx = GqlExecutionContext.create(context)
    const request = gqlCtx.getContext().req || context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      return false
    }

    const currentPlan = await this.subscriptionsService.getUserPlan(user.id)
    const currentTier = PLAN_HIERARCHY[currentPlan]
    const requiredTier = PLAN_HIERARCHY[requiredPlan]

    if (currentTier < requiredTier) {
      throw new ForbiddenException({
        message: `This feature requires the ${requiredPlan} plan.`,
        requiredPlan,
        currentPlan,
      })
    }

    return true
  }
}
