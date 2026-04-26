import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true })
  const config = app.get(ConfigService)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )

  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  const origins = config
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  })

  app.setGlobalPrefix('api')

  const port = config.getOrThrow<number>('PORT')
  await app.listen(port)
  Logger.log(`🚀 Ajo Manager API running on http://localhost:${port}/api`, 'Bootstrap')
}

bootstrap()
