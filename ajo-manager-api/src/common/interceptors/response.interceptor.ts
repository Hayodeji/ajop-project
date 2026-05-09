import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { fixDates } from '../utils/format'
import type { ApiResponse } from '../types/api-response'

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Skip wrapping but fix dates for GraphQL requests
    if (context.getType<string>() === 'graphql') {
      return next.handle().pipe(map((payload) => fixDates(payload)))
    }

    return next.handle().pipe(
      map((payload: T | { data: T; meta?: Record<string, unknown> }) => {
        const transformed = fixDates(payload)
        if (
          transformed !== null &&
          typeof transformed === 'object' &&
          'data' in (transformed as object)
        ) {
          return transformed as ApiResponse<T>
        }
        return { data: transformed as T }
      }),
    )
  }
}
