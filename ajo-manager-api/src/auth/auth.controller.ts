import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CheckPhoneDto } from './dto/check-phone.dto'
import { CompleteProfileDto } from './dto/complete-profile.dto'
import { SupabaseAuthGuard } from './auth.guard'
import { CurrentUser } from './current-user.decorator'
import { User } from '@supabase/supabase-js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-phone')
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto.phone)
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('complete-profile')
  completeProfile(@CurrentUser() user: User, @Body() dto: CompleteProfileDto) {
    // phone comes from the Supabase auth record (set at signup)
    const authPhone = (user.phone ?? '').replace(/\s/g, '') || undefined
    return this.authService.completeProfile(user.id, dto, authPhone)
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id)
  }
}
