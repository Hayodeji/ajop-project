import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CompleteProfileDto } from './dto/complete-profile.dto'

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async checkPhone(phone: string): Promise<{ isNewUser: boolean }> {
    const { data } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    return { isNewUser: !data }
  }

  async completeProfile(userId: string, dto: CompleteProfileDto, authPhone?: string) {
    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const updates: Record<string, unknown> = { name: dto.name }
      if (dto.phone) updates.phone = dto.phone
      const { data, error } = await this.supabase
        .getAdminClient()
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw new ConflictException(error.message)
      return data
    }

    let referredBy: string | null = null
    if (dto.referralCode) {
      const { data: referrer } = await this.supabase
        .getAdminClient()
        .from('profiles')
        .select('user_id')
        .eq('referral_code', dto.referralCode)
        .maybeSingle()
      if (referrer) referredBy = referrer.user_id
    }

    const referralCode = this.generateReferralCode()

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .insert({
        user_id: userId,
        phone: dto.phone ?? authPhone ?? null,
        name: dto.name,
        plan: 'basic',
        is_pro: false,
        referral_code: referralCode,
        referred_by: referredBy,
      })
      .select()
      .single()

    if (error) throw new ConflictException(error.message)
    return data
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new NotFoundException('Profile not found')
    return data
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}
