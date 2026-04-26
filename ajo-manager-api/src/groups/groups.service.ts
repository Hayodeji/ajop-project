import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { PLAN_GROUP_LIMITS } from '../subscriptions/subscriptions.types'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupDto } from './dto/update-group.dto'
import type { Group } from './group.types'

const TABLE = 'groups'

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name)

  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async create(adminId: string, dto: CreateGroupDto): Promise<Group> {
    const plan = await this.subscriptions.getUserPlan(adminId)
    const groupLimit = PLAN_GROUP_LIMITS[plan]
    const { count } = await this.supabase
      .getAdminClient()
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', adminId)
    if ((count ?? 0) >= groupLimit) {
      throw new ForbiddenException(
        `Your ${plan} plan allows a maximum of ${groupLimit} group${groupLimit === 1 ? '' : 's'}. Upgrade to create more.`,
      )
    }

    const publicToken = randomBytes(16).toString('base64url')

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(TABLE)
      .insert({
        admin_id: adminId,
        name: dto.name,
        contribution_amount: dto.contribution_amount,
        frequency: dto.frequency,
        member_count: dto.member_count,
        public_token: publicToken,
      })
      .select()
      .single()

    if (error || !data) {
      this.logger.error(`Create group failed: ${error?.message}`)
      throw new InternalServerErrorException('Could not create the group.')
    }

    return data as Group
  }

  async findAllForAdmin(adminId: string): Promise<Group[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(TABLE)
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`List groups failed: ${error.message}`)
      throw new InternalServerErrorException('Could not load your groups.')
    }

    return (data ?? []) as Group[]
  }

  async findOne(adminId: string, id: string): Promise<Group> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('admin_id', adminId)
      .maybeSingle()

    if (error) {
      this.logger.error(`Fetch group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not load that group.')
    }

    if (!data) {
      throw new NotFoundException('That group was not found.')
    }

    return data as Group
  }

  async update(
    adminId: string,
    id: string,
    dto: UpdateGroupDto,
  ): Promise<Group> {
    await this.findOne(adminId, id)

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(TABLE)
      .update(dto)
      .eq('id', id)
      .eq('admin_id', adminId)
      .select()
      .single()

    if (error || !data) {
      this.logger.error(`Update group failed: ${error?.message}`)
      throw new InternalServerErrorException('Could not update the group.')
    }

    return data as Group
  }

  async remove(adminId: string, id: string): Promise<void> {
    await this.findOne(adminId, id)

    const { error } = await this.supabase
      .getAdminClient()
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('admin_id', adminId)

    if (error) {
      this.logger.error(`Delete group failed: ${error.message}`)
      throw new InternalServerErrorException('Could not delete the group.')
    }
  }
}
