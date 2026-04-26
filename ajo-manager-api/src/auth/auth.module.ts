import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { SupabaseAuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [SupabaseAuthGuard, AuthService],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
