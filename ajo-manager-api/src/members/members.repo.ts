import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Member } from './members.schema'
import { CreateMemberInput, UpdateMemberInput } from './members.dto'

@Injectable()
export class MembersRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async create(input: CreateMemberInput): Promise<Member> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .insert({
        group_id: input.group_id,
        name: input.name,
        phone: input.phone,
        payout_position: input.payout_position,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async countActiveMembers(groupId: string): Promise<number> {
    const { count, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_active', true)

    if (error) throw error
    return count ?? 0
  }

  async findByPosition(groupId: string, position: number): Promise<Member | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('payout_position', position)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findAllByGroup(groupId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('payout_position', { ascending: true })

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
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
      .from('group_members')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
  
  async getGroupAdminId(groupId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('admin_id')
      .eq('id', groupId)
      .maybeSingle()
    
    if (error) throw error
    return data?.admin_id || null
  }
}
