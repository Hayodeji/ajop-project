import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): any => {
    const ctx = GqlExecutionContext.create(context)
    const gqlReq = ctx.getContext().req
    if (gqlReq && gqlReq.user) {
      return gqlReq.user
    }

    const httpReq = context.switchToHttp().getRequest()
    return httpReq.user
  },
)
