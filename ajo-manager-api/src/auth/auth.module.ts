import { Module, forwardRef } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { SupabaseAuthGuard } from './auth.guard'
import { GqlAuthGuard } from './gql-auth.guard'
import { AuthService } from './auth.service'
import { AuthResolver } from './auth.resolver'
import { AuthRepo } from './auth.repo'
import { PlanGuard } from './plan.guard'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports: [SupabaseModule, forwardRef(() => SubscriptionsModule)],
  providers: [SupabaseAuthGuard, GqlAuthGuard, AuthService, AuthResolver, AuthRepo, PlanGuard],
  exports: [SupabaseAuthGuard, GqlAuthGuard, PlanGuard, AuthService, AuthRepo],
})
export class AuthModule {}
