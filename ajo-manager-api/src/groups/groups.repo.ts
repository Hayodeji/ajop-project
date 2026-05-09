import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { Group } from './groups.schema'
import { CreateGroupInput, UpdateGroupInput } from './groups.dto'

@Injectable()
export class GroupsRepo {
  constructor(private readonly supabase: SupabaseService) {}

  async create(adminId: string, input: any): Promise<Group> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .insert({
        admin_id: adminId,
        ...input,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async countByAdminId(adminId: string): Promise<number> {
    const { count, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', adminId)

    if (error) throw error
    return count ?? 0
  }

  async findAll(adminId: string): Promise<Group[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findById(adminId: string, id: string): Promise<Group | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('*')
      .eq('id', id)
      .eq('admin_id', adminId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async update(adminId: string, id: string, input: UpdateGroupInput): Promise<Group> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .update(input)
      .eq('id', id)
      .eq('admin_id', adminId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(adminId: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('groups')
      .delete()
      .eq('id', id)
      .eq('admin_id', adminId)

    if (error) throw error
  }

  async getActiveMembers(groupId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('group_members')
      .select('name, payout_position')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('payout_position')

    if (error) throw error
    return data || []
  }
}
