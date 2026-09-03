import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ProfileEntity, ProfilePlan, UserRole } from '../database/entities/profile.entity'
import { GroupEntity } from '../database/entities/group.entity'
import { SubscriptionEntity } from '../database/entities/subscription.entity'
import { ContributionEntity, ContributionStatus } from '../database/entities/contribution.entity'
import { PayoutEntity } from '../database/entities/payout.entity'
import { NotificationEntity } from '../database/entities/notification.entity'
import { AuditLogEntity } from '../database/entities/audit-log.entity'
import { SubscriptionPlan, SubscriptionStatus } from '../subscriptions/subscriptions.schema'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepo: Repository<SubscriptionEntity>,
    @InjectRepository(ContributionEntity)
    private readonly contributionsRepo: Repository<ContributionEntity>,
    @InjectRepository(PayoutEntity)
    private readonly payoutsRepo: Repository<PayoutEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  async getStats() {
    const [totalUsers, totalGroups, activeSubscriptions, trialSubscriptions, totalContributions, payoutRows] =
      await Promise.all([
        this.profileRepo.count(),
        this.groupsRepo.count(),
        this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.TRIALING } }),
        this.contributionsRepo.count({ where: { status: ContributionStatus.PAID } }),
        this.payoutsRepo.find(),
      ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await this.profileRepo.createQueryBuilder('p')
      .where('p.createdAt >= :since', { since: today.toISOString() })
      .getCount()

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const newUsersThisWeek = await this.profileRepo.createQueryBuilder('p')
      .where('p.createdAt >= :since', { since: weekAgo.toISOString() })
      .getCount()

    const totalPayoutAmount = (payoutRows ?? []).reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)

    return {
      totalUsers: totalUsers ?? 0,
      totalGroups: totalGroups ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      trialSubscriptions: trialSubscriptions ?? 0,
      totalContributions: totalContributions ?? 0,
      totalPayoutAmount,
      newUsersToday: newUsersToday ?? 0,
      newUsersThisWeek: newUsersThisWeek ?? 0,
    }
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const from = (page - 1) * limit

    const qb = this.profileRepo.createQueryBuilder('p').orderBy('p.createdAt', 'DESC')
    if (search) {
      qb.where('p.name ILIKE :s OR p.phone ILIKE :s', { s: `%${search}%` })
    }

    qb.skip(from).take(limit)
    const [rows, total] = await qb.getManyAndCount()

    const userIds = rows.map(r => r.userId)
    const subscriptions = userIds.length ? await this.subscriptionsRepo.find({ where: { userId: In(userIds) } }) : []
    const groups = userIds.length ? await this.groupsRepo.find({ where: { adminId: In(userIds) } }) : []

    const subMap: Record<string, any> = {}
    for (const s of subscriptions ?? []) subMap[s.userId] = s

    const groupCountMap: Record<string, number> = {}
    for (const g of groups ?? []) groupCountMap[g.adminId] = (groupCountMap[g.adminId] ?? 0) + 1

    return {
      data: rows.map((u: any) => ({
        ...u,
        subscriptions: subMap[u.userId] ?? null,
        groups_count: groupCountMap[u.userId] ?? 0,
      })),
      total,
      page,
      limit,
    }
  }

  async getUserDetail(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } })
    const subscription = await this.subscriptionsRepo.findOne({ where: { userId } })
    const groups = await this.groupsRepo.find({ where: { adminId: userId } })

    const groupIds = groups.map(g => g.id)
    const totalContributions = groupIds.length ? await this.contributionsRepo.count({ where: { groupId: In(groupIds), status: ContributionStatus.PAID } }) : 0
    const payouts = groupIds.length ? await this.payoutsRepo.find({ where: { groupId: In(groupIds) } }) : []
    const totalPayoutAmount = (payouts ?? []).reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)

    return {
      profile,
      subscription,
      groups: groups ?? [],
      stats: {
        totalContributions: totalContributions ?? 0,
        totalPayoutAmount,
      },
    }
  }

  async updateUser(userId: string, updates: { role?: string; plan?: string; suspended?: boolean }) {
    if (updates.role) {
      await this.profileRepo.update({ userId }, { role: updates.role as UserRole })
    }

    if (updates.plan) {
      await this.subscriptionsRepo.update({ userId }, { plan: updates.plan as SubscriptionPlan, status: SubscriptionStatus.ACTIVE })
      await this.profileRepo.update({ userId }, { plan: updates.plan as ProfilePlan, isPro: updates.plan === 'pro' })
    }

    if (updates.suspended !== undefined) {
      await this.profileRepo.update({ userId }, { isSuspended: updates.suspended })
    }

    const profile = await this.profileRepo.findOne({ where: { userId } })
    return profile
  }

  async setUserLimits(userId: string, limits: { custom_group_limit: number | null; custom_member_limit: number | null; limits_note?: string | null }) {
    const existing = await this.subscriptionsRepo.findOne({ where: { userId } })
    if (!existing) throw new Error(`No subscription found for user ${userId}. Assign a plan first.`)

    await this.subscriptionsRepo.update({ userId }, {
      customGroupLimit: limits.custom_group_limit,
      customMemberLimit: limits.custom_member_limit,
      limitsNote: limits.limits_note ?? null,
    } as any)

    return this.subscriptionsRepo.findOne({ where: { userId } })
  }

  async getGroups(page = 1, limit = 20, search?: string) {
    const from = (page - 1) * limit

    const qb = this.groupsRepo.createQueryBuilder('g').orderBy('g.createdAt', 'DESC')
    if (search) qb.where('g.name ILIKE :s', { s: `%${search}%` })

    qb.skip(from).take(limit)
    const [rows, total] = await qb.getManyAndCount()

    // Enrich with active member counts
    const groupIds = rows.map(r => r.id)
    const memberCounts = groupIds.length ? await this.groupsRepo.createQueryBuilder('g')
      .leftJoin('g.members', 'm')
      .select('g.id', 'groupId')
      .addSelect('COUNT(m.id)', 'count')
      .where('g.id IN (:...ids)', { ids: groupIds })
      .andWhere('m.isActive = true')
      .groupBy('g.id')
      .getRawMany() : []

    const countMap: Record<string, number> = {}
    for (const c of memberCounts ?? []) countMap[c.groupId] = parseInt(c.count, 10)

    return { data: rows.map(g => ({ ...g, active_member_count: countMap[g.id] ?? 0 })), total, page, limit }
  }

  async getGroupDetail(groupId: string) {
    const group = await this.groupsRepo.findOne({ where: { id: groupId } })
    const members = await this.groupsRepo.manager.getRepository('group_members').find({ where: { groupId }, order: { payoutPosition: 'ASC' } })
    const contributions = await this.contributionsRepo.find({ where: { groupId }, order: { paidAt: 'DESC' }, take: 50 })
    const payouts = await this.payoutsRepo.find({ where: { groupId }, order: { paidOutAt: 'DESC' } })

    return { group, members: members ?? [], contributions: contributions ?? [], payouts: payouts ?? [] }
  }

  async getSubscriptions(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const qb = this.subscriptionsRepo.createQueryBuilder('s').orderBy('s.createdAt', 'DESC')
    qb.skip(from).take(limit)
    const [rows, total] = await qb.getManyAndCount()

    const userIds = rows.map(r => r.userId)
    const profiles = userIds.length ? await this.profileRepo.findBy({ userId: In(userIds) }) : []
    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.userId] = p

    return { data: rows.map(r => ({ ...r, profiles: profileMap[r.userId] ?? null })), total, page, limit }
  }

  async getActivity(limit = 50) {
    const logs = await this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit })
    if (!logs?.length) return []

    const actorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))]
    const profiles = actorIds.length ? await this.profileRepo.findBy({ userId: In(actorIds) }) : []
    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.userId] = p

    return logs.map(log => {
      const actor = profileMap[log.actorId] ?? null
      const m = log.metadata ?? {}
      let type = 'info'
      let label = log.action
      let meta = ''

      switch (log.action) {
        case 'group.created':
          type = 'group'
          label = `New group created: "${m.name ?? 'Unknown'}"`
          meta = actor ? `by ${actor.name}` : ''
          break
        case 'group.deleted':
          type = 'group'
          label = `Group deleted`
          meta = actor ? `by ${actor.name}` : ''
          break
        case 'member.added':
          type = 'member'
          label = `${m.name ?? 'New member'} added to "${m.group_name ?? 'a group'}"`
          meta = `Position #${m.position ?? '?'}`
          break
        case 'member.removed':
          type = 'member'
          label = `${m.name ?? 'Member'} removed from a group`
          meta = actor ? `by ${actor.name}` : ''
          break
        case 'contribution.paid':
          type = 'contribution'
          label = `${m.member_name ?? 'Member'} paid contribution — cycle ${m.cycle ?? '?'}`
          meta = m.group_name ? `in "${m.group_name}"` : ''
          break
        case 'contribution.late':
          type = 'contribution'
          label = `${m.member_name ?? 'Member'} marked late — cycle ${m.cycle ?? '?'}`
          meta = m.group_name ? `in "${m.group_name}"` : ''
          break
        case 'payout.recorded':
          type = 'payout'
          label = `Payout of ₦${((m.amount ?? 0) / 100).toLocaleString()} recorded`
          meta = m.group_name ? `in "${m.group_name}"` : ''
          break
        case 'user.signup':
          type = 'signup'
          label = `${m.name ?? 'User'} signed up`
          meta = m.phone ?? ''
          break
        case 'subscription.activated':
          type = 'subscription'
          label = `${actor?.name ?? 'User'} activated ${m.plan ?? ''} plan`
          meta = actor?.phone ?? ''
          break
      }

      return { type, label, meta, time: log.createdAt }
    })
  }

  async getEngagement() {
    const active = await this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.ACTIVE } })
    const trialing = await this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.TRIALING } })
    return { active, trialing }
  }

  async removeUser(userId: string) {
    // 1. Check if user has groups. If they do, we shouldn't delete them as it orphans data.
    const groupCount = await this.groupsRepo.count({ where: { adminId: userId } })
    if (groupCount && groupCount > 0) {
      throw new Error('Cannot remove an admin with existing groups. Please use the "Lock Admin" feature instead.')
    }

    // 2. Delete non-critical related records first
    await this.subscriptionsRepo.delete({ userId })
    await this.notificationsRepo.delete({ userId })

    // 3. Remove local profile record. Deleting the upstream auth user must be handled by the auth provider integration.
    await this.profileRepo.delete({ userId })
    return { success: true }
  }
}
