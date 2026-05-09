import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Payout } from './payouts.schema'
import { CreatePayoutInput, UpdatePayoutInput } from './payouts.dto'

@Injectable()
export class PayoutsRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async create(input: CreatePayoutInput): Promise<Payout> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payouts')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAllByGroup(groupId: string): Promise<Payout[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payouts')
      .select('*, group_members(name)')
      .eq('group_id', groupId)
      .order('cycle_number', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Payout | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payouts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async update(id: string, input: UpdatePayoutInput): Promise<Payout> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payouts')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('payouts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
