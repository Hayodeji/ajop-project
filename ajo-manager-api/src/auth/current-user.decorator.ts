import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import type { User } from '@supabase/supabase-js'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context)
    const gqlReq = ctx.getContext().req
    if (gqlReq && gqlReq.user) {
      return gqlReq.user
    }

    const httpReq = context.switchToHttp().getRequest()
    return httpReq.user
  },
)
