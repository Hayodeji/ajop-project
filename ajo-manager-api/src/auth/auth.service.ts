import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';
import { UserEntity } from '../database/entities/user.entity';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { TokenPayload } from './services/jwt.service';

export interface AuthSignUpInput {
  phone: string;
  password: string;
  name?: string;
  email?: string;
}

export interface AuthLoginInput {
  phone: string;
  password: string;
}

export interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokensRepository: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private otpService: OtpService,
  ) {}

  /**
   * Sign up with phone and password
   */
  async signUpWithPhone(input: AuthSignUpInput): Promise<AuthTokensOutput> {
    const { phone, password, name, email } = input;

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet strength requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { phone: this.otpService.normalizePhone(phone) },
    });

    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Create new user
    const user = this.usersRepository.create({
      phone: this.otpService.normalizePhone(phone),
      passwordHash,
      name,
      email,
      role: 'user',
      isActive: true,
      phoneVerifiedAt: new Date(), // Auto-verify on signup
    });

    const savedUser = await this.usersRepository.save(user);

    this.logger.log(`User signed up: ${savedUser.id}`);

    // Generate tokens
    return this.generateTokens(savedUser);
  }

  /**
   * Login with phone and password
   */
  async loginWithPhone(input: AuthLoginInput): Promise<AuthTokensOutput> {
    const { phone, password } = input;

    // Find user
    const user = await this.usersRepository.findOne({
      where: { phone: this.otpService.normalizePhone(phone) },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    // Check if user is suspended
    if (user.isSuspended) {
      throw new UnauthorizedException('User account is suspended');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    this.logger.log(`User logged in: ${user.id}`);

    // Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshTokenString: string): Promise<{
    accessToken: string;
  }> {
    // Verify refresh token
    const decoded = this.jwtService.verifyRefreshToken(refreshTokenString);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find refresh token in database
    const refreshToken = await this.refreshTokensRepository.findOne({
      where: {
        token: refreshTokenString,
        revoked: false,
      },
      relations: {
        user: true,
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found or revoked');
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = refreshToken.user;

    // Check if user is active
    if (!user.isActive || user.isSuspended) {
      throw new UnauthorizedException('User account is not active');
    }

    // Generate new access token
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    this.logger.log(`Access token refreshed for user: ${user.id}`);

    return { accessToken };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToDto(user);
  }

  /**
   * Request phone verification OTP
   */
  async requestPhoneVerification(phone: string): Promise<{
    message: string;
    expiresIn: number;
  }> {
    const normalizedPhone = this.otpService.normalizePhone(phone);

    // Check if user exists
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate and send OTP
    const sent = await this.otpService.sendOtpViaSms(phone);

    if (!sent) {
      throw new BadRequestException('Failed to send OTP');
    }

    const expiresIn = this.otpService.getOtpRemainingTime(phone);

    this.logger.log(`Phone verification OTP sent to: ${normalizedPhone}`);

    return {
      message: 'OTP sent to your phone',
      expiresIn,
    };
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhoneOtp(phone: string, otp: string): Promise<{ message: string }> {
    const normalizedPhone = this.otpService.normalizePhone(phone);

    // Verify OTP
    const isValid = this.otpService.verifyOtp(phone, otp);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.phoneVerifiedAt = new Date();
    await this.usersRepository.save(user);

    this.logger.log(`Phone verified for user: ${user.id}`);

    return { message: 'Phone verified successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(phone: string): Promise<{
    message: string;
    expiresIn: number;
  }> {
    const normalizedPhone = this.otpService.normalizePhone(phone);

    // Check if user exists
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Send OTP for password reset
    const sent = await this.otpService.sendOtpViaSms(phone);

    if (!sent) {
      throw new BadRequestException('Failed to send OTP');
    }

    const expiresIn = this.otpService.getOtpRemainingTime(phone);

    this.logger.log(`Password reset OTP sent to: ${normalizedPhone}`);

    return {
      message: 'OTP sent to your phone for password reset',
      expiresIn,
    };
  }

  /**
   * Reset password with OTP verification
   */
  async resetPasswordWithOtp(
    phone: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const normalizedPhone = this.otpService.normalizePhone(phone);

    // Verify OTP
    const isValid = this.otpService.verifyOtp(phone, otp);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Validate new password
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'New password does not meet strength requirements',
        errors: passwordValidation.errors,
      });
    }

    // Find user
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash and update password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokensRepository.update(
      { userId: user.id },
      { revoked: true },
    );

    this.logger.log(`Password reset for user: ${user.id}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    // Mark refresh token as revoked
    await this.refreshTokensRepository.update(
      { token: refreshToken },
      { revoked: true },
    );

    this.logger.log(`User logged out`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: UserEntity): Promise<AuthTokensOutput> {
    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const refreshTokenString = this.jwtService.generateRefreshToken(user.id);

    // Store refresh token in database
    const refreshToken = this.refreshTokensRepository.create({
      userId: user.id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await this.refreshTokensRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: this.mapUserToDto(user),
    };
  }

  /**
   * Map User entity to DTO
   */
  private mapUserToDto(user: UserEntity): UserDto {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneVerified: !!user.phoneVerifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    };
  }

  // ==== BACKWARD COMPATIBILITY METHODS FOR GRAPHQL RESOLVER ====

  /**
   * Legacy: Check if phone exists (for compatibility with resolver)
   */
  async checkPhone(phone: string): Promise<{ isNewUser: boolean }> {
    const normalizedPhone = this.otpService.normalizePhone(phone);
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });
    return { isNewUser: !user };
  }

  /**
   * Legacy: Complete profile (for compatibility with resolver)
   */
  async completeProfile(userId: string, input: any, authPhone?: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user profile
    user.name = input.name || user.name;
    if (input.email) {
      user.email = input.email;
    }
    if (input.phone) {
      user.phone = this.otpService.normalizePhone(input.phone);
    }
    if (authPhone && !user.phone) {
      user.phone = this.otpService.normalizePhone(authPhone);
    }

    const updated = await this.usersRepository.save(user);
    return this.mapUserToDto(updated);
  }

  /**
   * Legacy: Forgot password (for compatibility with resolver)
   */
  async forgotPassword(input: any): Promise<any> {
    if (input.phone) {
      return this.requestPasswordReset(input.phone);
    }
    throw new BadRequestException('Phone is required');
  }

  /**
   * Legacy: Reset password (for compatibility with resolver)
   */
  async resetPassword(userId: string, password: string): Promise<any> {
    // Validate new password
    const passwordValidation = this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'New password does not meet strength requirements',
        errors: passwordValidation.errors,
      });
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash and update password
    const passwordHash = await this.passwordService.hashPassword(password);
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokensRepository.update(
      { userId: user.id },
      { revoked: true },
    );

    return { success: true };
  }
}
