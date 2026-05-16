import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Contribution } from './contributions.schema'
import { CreateContributionInput, UpdateContributionInput } from './contributions.dto'

@Injectable()
export class ContributionsRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async findExisting(groupId: string, memberId: string, cycleNumber: number): Promise<Contribution | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('*')
      .eq('group_id', groupId)
      .eq('member_id', memberId)
      .eq('cycle_number', cycleNumber)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async create(input: any): Promise<Contribution> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, input: any): Promise<Contribution> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAllByGroup(groupId: string, cycleNumber?: number, fromDate?: string, toDate?: string): Promise<Contribution[]> {
    let query = this.supabase
      .getAdminClient()
      .from('contributions')
      .select('*, group_members(name, phone, payout_position)')
      .eq('group_id', groupId)
      .order('cycle_number', { ascending: false })
      .order('id', { ascending: false })

    if (cycleNumber) {
      query = query.eq('cycle_number', cycleNumber)
    }
    if (fromDate && toDate) {
      query = query.gte('paid_at', fromDate).lte('paid_at', toDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async countPaidInCycle(groupId: string, cycleNumber: number): Promise<number> {
    const { count, error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('cycle_number', cycleNumber)
      .eq('status', 'paid')

    if (error) throw error
    return count ?? 0
  }

  async bulkInsert(inserts: any[]): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('contributions')
      .insert(inserts)

    if (error) throw error
  }
}
