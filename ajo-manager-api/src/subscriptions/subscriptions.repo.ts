import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class SubscriptionsRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async findByUserId(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async update(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async upsert(subscription: any) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .upsert(subscription, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}
