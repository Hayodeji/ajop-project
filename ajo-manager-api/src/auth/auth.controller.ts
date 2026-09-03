import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, AuthSignUpInput, AuthLoginInput, AuthTokensOutput, UserDto } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtGuard } from './guards/jwt.guard';

export interface SignUpRequestDto {
  phone: string;
  password: string;
  name?: string;
  email?: string;
}

export interface LoginRequestDto {
  phone: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RequestPhoneVerificationDto {
  phone: string;
}

export interface VerifyPhoneOtpDto {
  phone: string;
  otp: string;
}

export interface RequestPasswordResetDto {
  phone: string;
}

export interface ResetPasswordDto {
  phone: string;
  otp: string;
  newPassword: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Sign up with phone and password
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() input: SignUpRequestDto): Promise<AuthTokensOutput> {
    return this.authService.signUpWithPhone(input);
  }

  /**
   * Login with phone and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() input: LoginRequestDto): Promise<AuthTokensOutput> {
    return this.authService.loginWithPhone(input);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() input: RefreshTokenRequestDto): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(input.refreshToken);
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: any): Promise<UserDto> {
    return this.authService.getProfile(user.userId);
  }

  /**
   * Request phone verification OTP
   */
  @Post('verify-phone/request')
  @HttpCode(HttpStatus.OK)
  async requestPhoneVerification(
    @Body() input: RequestPhoneVerificationDto,
  ): Promise<{ message: string; expiresIn: number }> {
    return this.authService.requestPhoneVerification(input.phone);
  }

  /**
   * Verify phone with OTP
   */
  @Post('verify-phone/confirm')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(@Body() input: VerifyPhoneOtpDto): Promise<{ message: string }> {
    return this.authService.verifyPhoneOtp(input.phone, input.otp);
  }

  /**
   * Request password reset
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() input: RequestPasswordResetDto,
  ): Promise<{ message: string; expiresIn: number }> {
    return this.authService.requestPasswordReset(input.phone);
  }

  /**
   * Reset password with OTP
   */
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() input: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPasswordWithOtp(input.phone, input.otp, input.newPassword);
  }

  /**
   * Logout (revoke refresh token)
   */
  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('Authorization') authHeader: string,
    @Body() input: RefreshTokenRequestDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(input.refreshToken);
  }
}
