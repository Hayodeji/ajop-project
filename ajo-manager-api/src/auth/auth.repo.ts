import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AuthRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async findProfileByUserId(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findProfileByPhone(phone: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByReferralCode(code: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('user_id')
      .eq('referral_code', code)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async createProfile(profile: any) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .insert(profile)
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}
