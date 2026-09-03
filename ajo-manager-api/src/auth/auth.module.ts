import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AuthResolver } from './auth.resolver'
import { PlanGuard } from './plan.guard'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { UserEntity } from '../database/entities/user.entity'
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity'
import { ProfileEntity } from '../database/entities/profile.entity'
import { JwtGuard } from './guards/jwt.guard'
import { GqlAuthGuard } from './gql-auth.guard'
import { JwtService } from './services/jwt.service'
import { PasswordService } from './services/password.service'
import { OtpService } from './services/otp.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity, ProfileEntity]),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [AuthController],
  providers: [JwtGuard, GqlAuthGuard, AuthService, AuthResolver, PlanGuard, JwtService, PasswordService, OtpService],
  exports: [JwtGuard, GqlAuthGuard, PlanGuard, AuthService, JwtService],
})
export class AuthModule {}
