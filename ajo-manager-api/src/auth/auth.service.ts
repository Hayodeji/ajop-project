import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { AuthRepo } from './auth.repo'
import { CompleteProfileInput, ForgotPasswordInput } from './auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly authRepo: AuthRepo,
  ) {}

  async checkPhone(phone: string): Promise<{ isNewUser: boolean }> {
    try {
      const data = await this.authRepo.findProfileByPhone(phone)
      return { isNewUser: !data }
    } catch (error) {
      return { isNewUser: true }
    }
  }

  async completeProfile(userId: string, input: CompleteProfileInput & { referralCode?: string, phone?: string }, authPhone?: string) {
    const existing = await this.authRepo.findProfileByUserId(userId)

    if (existing) {
      const updates: Record<string, unknown> = { name: input.name }
      if (input.phone) updates.phone = input.phone
      if (input.email) {
        // Try to update email in Supabase Auth
        await this.supabase.getAdminClient().auth.admin.updateUserById(userId, { email: input.email, email_confirm: true })
      }
      try {
        return await this.authRepo.updateProfile(userId, updates)
      } catch (error) {
        throw new ConflictException(error.message)
      }
    }

    let referredBy: string | null = null
    if (input.referralCode) {
      const referrer = await this.authRepo.findByReferralCode(input.referralCode)
      if (referrer) referredBy = referrer.user_id
    }

    const referralCode = this.generateReferralCode()

    if (input.email) {
      // Try to update email in Supabase Auth
      await this.supabase.getAdminClient().auth.admin.updateUserById(userId, { email: input.email, email_confirm: true })
    }

    try {
      return await this.authRepo.createProfile({
        user_id: userId,
        phone: input.phone ?? authPhone ?? null,
        name: input.name,
        plan: 'basic',
        is_pro: false,
        referral_code: referralCode,
        referred_by: referredBy,
      })
    } catch (error) {
      throw new ConflictException(error.message)
    }
  }

  async getProfile(userId: string) {
    try {
      const data = await this.authRepo.findProfileByUserId(userId)
      if (!data) throw new NotFoundException('Profile not found')
      return data
    } catch (error) {
      throw new NotFoundException('Profile not found')
    }
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async forgotPassword(input: ForgotPasswordInput) {
    if (input.email) {
      const { error } = await this.supabase.getAdminClient().auth.resetPasswordForEmail(input.email)
      if (error) throw new ConflictException(error.message)
      return { success: true, message: 'Password reset email sent' }
    } else if (input.phone) {
      const { error } = await this.supabase.getAdminClient().auth.signInWithOtp({ phone: input.phone })
      if (error) throw new ConflictException(error.message)
      return { success: true, message: 'OTP sent to phone' }
    }
    throw new ConflictException('Email or phone is required')
  }

  async resetPassword(userId: string, password: string) {
    const { error } = await this.supabase.getAdminClient().auth.admin.updateUserById(userId, { password })
    if (error) throw new ConflictException(error.message)
    return { success: true }
  }
}
