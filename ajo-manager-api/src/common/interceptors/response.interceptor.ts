import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { ApiResponse } from '../types/api-response'

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload: T | { data: T; meta?: Record<string, unknown> }) => {
        if (
          payload !== null &&
          typeof payload === 'object' &&
          'data' in (payload as object)
        ) {
          return payload as ApiResponse<T>
        }
        return { data: payload as T }
      }),
    )
  }
}
