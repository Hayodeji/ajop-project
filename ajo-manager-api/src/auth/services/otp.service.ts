import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio;
  private otpStore: Map<string, { otp: string; expiresAt: number; attempts: number }> = new Map();
  private otpLength: number;
  private otpExpiration: number; // in seconds
  private maxAttempts: number;

  constructor(private configService: ConfigService) {
    this.otpLength = parseInt(this.configService.get('OTP_LENGTH') || '6', 10);
    this.otpExpiration = parseInt(this.configService.get('OTP_EXPIRATION') || '600', 10); // 10 minutes default
    this.maxAttempts = 5;

    // Initialize Twilio (only when credentials are present and valid)
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken && accountSid.startsWith('AC')) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials missing or invalid — SMS OTP disabled.');
    }
  }

  /**
   * Generate a random OTP
   */
  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // If starts with country code, keep it; otherwise assume Nigeria (+234)
    if (normalized.startsWith('234')) {
      normalized = '+' + normalized;
    } else if (normalized.length === 10 && normalized.startsWith('0')) {
      // Nigerian number starting with 0 -> +234
      normalized = '+234' + normalized.substring(1);
    } else if (!normalized.startsWith('+')) {
      normalized = '+234' + normalized;
    }

    return normalized;
  }

  /**
   * Generate OTP and store it
   */
  generateOtpForPhone(phone: string): { otp: string; expiresIn: number } {
    const normalizedPhone = this.normalizePhone(phone);
    const otp = this.generateOtp();
    const expiresAt = Date.now() + this.otpExpiration * 1000;

    this.otpStore.set(normalizedPhone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    this.logger.log(`OTP generated for ${normalizedPhone}: ${otp} (expires in ${this.otpExpiration}s)`);

    return {
      otp,
      expiresIn: this.otpExpiration,
    };
  }

  /**
   * Send OTP via Twilio SMS
   */
  async sendOtpViaSms(phone: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone);

    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured. OTP would be sent via SMS if configured.');
      return true; // Continue in dev environment
    }

    try {
      const { otp } = this.generateOtpForPhone(phone);
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

      await this.twilioClient.messages.create({
        from: fromNumber,
        to: normalizedPhone,
        body: `Your AjoPot verification code is: ${otp}. This code expires in ${this.otpExpiration} seconds.`,
      });

      this.logger.log(`OTP sent successfully to ${normalizedPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${normalizedPhone}:`, error);
      return false;
    }
  }

  /**
   * Verify OTP for a phone number
   */
  verifyOtp(phone: string, otp: string): boolean {
    const normalizedPhone = this.normalizePhone(phone);
    const storedOtp = this.otpStore.get(normalizedPhone);

    if (!storedOtp) {
      this.logger.warn(`No OTP found for ${normalizedPhone}`);
      return false;
    }

    // Check if OTP expired
    if (Date.now() > storedOtp.expiresAt) {
      this.otpStore.delete(normalizedPhone);
      this.logger.warn(`OTP expired for ${normalizedPhone}`);
      return false;
    }

    // Check if max attempts exceeded
    if (storedOtp.attempts >= this.maxAttempts) {
      this.otpStore.delete(normalizedPhone);
      this.logger.warn(`Max OTP verification attempts exceeded for ${normalizedPhone}`);
      return false;
    }

    // Increment attempts
    storedOtp.attempts++;

    // Verify OTP
    if (storedOtp.otp === otp) {
      this.otpStore.delete(normalizedPhone);
      this.logger.log(`OTP verified successfully for ${normalizedPhone}`);
      return true;
    }

    this.logger.warn(`Invalid OTP attempt for ${normalizedPhone}`);
    return false;
  }

  /**
   * Check if phone has pending OTP
   */
  hasPendingOtp(phone: string): boolean {
    const normalizedPhone = this.normalizePhone(phone);
    const storedOtp = this.otpStore.get(normalizedPhone);

    if (!storedOtp) {
      return false;
    }

    // Check if not expired
    return Date.now() <= storedOtp.expiresAt;
  }

  /**
   * Get remaining time for OTP
   */
  getOtpRemainingTime(phone: string): number {
    const normalizedPhone = this.normalizePhone(phone);
    const storedOtp = this.otpStore.get(normalizedPhone);

    if (!storedOtp) {
      return 0;
    }

    const remaining = Math.max(0, storedOtp.expiresAt - Date.now());
    return Math.ceil(remaining / 1000); // Return in seconds
  }

  /**
   * Clear OTP for a phone (logout)
   */
  clearOtp(phone: string): void {
    const normalizedPhone = this.normalizePhone(phone);
    this.otpStore.delete(normalizedPhone);
  }

  /**
   * Clear all expired OTPs (cleanup)
   */
  cleanupExpiredOtps(): void {
    const now = Date.now();
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }
}
