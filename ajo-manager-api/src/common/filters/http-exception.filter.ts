import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { ApiError } from '../types/api-response'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message = this.extractMessage(exception, status)

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    const body: ApiError = {
      error: {
        message,
        code: exception instanceof HttpException ? exception.name : 'InternalServerError',
      },
    }

    response.status(status).json(body)
  }

  private extractMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'string') return res
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message: string | string[] }).message
        return Array.isArray(msg) ? msg[0] : msg
      }
      return exception.message
    }
    if (status >= 500) {
      return 'Something went wrong on our end. Please try again.'
    }
    return 'Request failed.'
  }
}
