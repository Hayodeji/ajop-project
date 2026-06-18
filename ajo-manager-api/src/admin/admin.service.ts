import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SubscriptionStatus } from '../subscriptions/subscriptions.schema'

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStats() {
    const db = this.supabase.getAdminClient()

    const [
      { count: totalUsers },
      { count: totalGroups },
      { count: activeSubscriptions },
      { count: trialSubscriptions },
      { count: totalContributions },
      { data: payoutData },
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('groups').select('id', { count: 'exact', head: true }),
      db.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', [SubscriptionStatus.ACTIVE]),
      db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', SubscriptionStatus.TRIALING),
      db.from('contributions').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      db.from('payouts').select('amount'),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: newUsersToday } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: newUsersThisWeek } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    const totalPayoutAmount = (payoutData ?? []).reduce(
      (sum: number, p: any) => sum + (p.amount ?? 0),
      0,
    )

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
    const db = this.supabase.getAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = db
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    const userIds = (data ?? []).map((u: any) => u.user_id)

    const [{ data: subscriptions }, { data: groupCounts }] = await Promise.all([
      db.from('subscriptions').select('user_id, plan, status, trial_ends_at').in('user_id', userIds),
      db.from('groups').select('admin_id').in('admin_id', userIds),
    ])

    const subMap: Record<string, any> = {}
    for (const s of subscriptions ?? []) subMap[s.user_id] = s

    const groupCountMap: Record<string, number> = {}
    for (const g of groupCounts ?? []) {
      groupCountMap[g.admin_id] = (groupCountMap[g.admin_id] ?? 0) + 1
    }

    return {
      data: (data ?? []).map((u: any) => ({
        ...u,
        subscriptions: subMap[u.user_id] ?? null,
        groups_count: groupCountMap[u.user_id] ?? 0,
      })),
      total: count ?? 0,
      page,
      limit,
    }
  }

  async getUserDetail(userId: string) {
    const db = this.supabase.getAdminClient()

    const [
      { data: profile },
      { data: subscription },
      { data: groups },
    ] = await Promise.all([
      db.from('profiles').select('*').eq('user_id', userId).single(),
      db.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
      db.from('groups').select('*, group_members(count)').eq('admin_id', userId),
    ])

    const groupIds = (groups ?? []).map((g: any) => g.id)
    const { count: totalContributions } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .in('group_id', groupIds)
      .eq('status', 'paid')

    const { data: payouts } = await db
      .from('payouts')
      .select('amount')
      .in('group_id', groupIds)

    const totalPayoutAmount = (payouts ?? []).reduce(
      (sum: number, p: any) => sum + (p.amount ?? 0),
      0,
    )

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
    const db = this.supabase.getAdminClient()

    if (updates.role) {
      await db.from('profiles').update({ role: updates.role }).eq('user_id', userId)
    }

    if (updates.plan) {
      await db
        .from('subscriptions')
        .update({ plan: updates.plan, status: SubscriptionStatus.ACTIVE })
        .eq('user_id', userId)
      await db.from('profiles').update({ plan: updates.plan, is_pro: updates.plan === 'pro' }).eq('user_id', userId)
    }

    if (updates.suspended !== undefined) {
      await db.from('profiles').update({ is_suspended: updates.suspended }).eq('user_id', userId)
    }

    const { data } = await db.from('profiles').select('*').eq('user_id', userId).single()
    return data
  }

  /**
   * Set or clear custom per-user group/member limits.
   * Passing null clears the override and reverts to plan defaults.
   */
  async setUserLimits(
    userId: string,
    limits: {
      custom_group_limit:  number | null
      custom_member_limit: number | null
      limits_note?:        string | null
    },
  ) {
    const db = this.supabase.getAdminClient()

    // Ensure a subscription row exists before patching limits
    const { data: existing } = await db
      .from('subscriptions')
      .select('id, plan')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      throw new Error(`No subscription found for user ${userId}. Assign a plan first.`)
    }

    const { data, error } = await db
      .from('subscriptions')
      .update({
        custom_group_limit:  limits.custom_group_limit,
        custom_member_limit: limits.custom_member_limit,
        limits_note:         limits.limits_note ?? null,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }


  async getGroups(page = 1, limit = 20, search?: string) {
    const db = this.supabase.getAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = db
      .from('groups')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    // Enrich with actual active member count per group
    const groupIds = (data ?? []).map((g: any) => g.id)
    const { data: memberCounts } = groupIds.length
      ? await db
          .from('group_members')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('is_active', true)
      : { data: [] }

    const countMap: Record<string, number> = {}
    for (const m of memberCounts ?? []) {
      countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1
    }

    return {
      data: (data ?? []).map((g: any) => ({ ...g, active_member_count: countMap[g.id] ?? 0 })),
      total: count ?? 0,
      page,
      limit,
    }
  }

  async getGroupDetail(groupId: string) {
    const db = this.supabase.getAdminClient()

    const [{ data: group }, { data: members }, { data: contributions }, { data: payouts }] =
      await Promise.all([
        db.from('groups').select('*').eq('id', groupId).single(),
        db.from('group_members').select('*').eq('group_id', groupId).order('payout_position'),
        db
          .from('contributions')
          .select('*')
          .eq('group_id', groupId)
          .order('paid_at', { ascending: false, nullsFirst: false })
          .limit(50),
        db
          .from('payouts')
          .select('*')
          .eq('group_id', groupId)
          .order('paid_out_at', { ascending: false }),
      ])

    return { group, members: members ?? [], contributions: contributions ?? [], payouts: payouts ?? [] }
  }

  async getSubscriptions(page = 1, limit = 20) {
    const db = this.supabase.getAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await db
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    const userIds = (data ?? []).map((s: any) => s.user_id)
    const { data: profiles } = await db
      .from('profiles')
      .select('user_id, name, phone')
      .in('user_id', userIds)

    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.user_id] = p

    return {
      data: (data ?? []).map((s: any) => ({ ...s, profiles: profileMap[s.user_id] ?? null })),
      total: count ?? 0,
      page,
      limit,
    }
  }

  async getActivity(limit = 50) {
    const db = this.supabase.getAdminClient()

    const { data: logs, error } = await db
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    if (!logs?.length) return []

    // Resolve actor profiles for display
    const actorIds = [...new Set((logs).map((l: any) => l.actor_id).filter(Boolean))]
    const { data: profiles } = actorIds.length
      ? await db.from('profiles').select('user_id, name, phone').in('user_id', actorIds)
      : { data: [] }
    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.user_id] = p

    return logs.map((log: any) => {
      const actor = profileMap[log.actor_id] ?? null
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

      return { type, label, meta, time: log.created_at }
    })
  }

  async removeUser(userId: string) {
    const db = this.supabase.getAdminClient()

    // 1. Check if user has groups. If they do, we shouldn't delete them as it orphans data.
    const { count: groupCount } = await db
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', userId)

    if (groupCount && groupCount > 0) {
      throw new Error('Cannot remove an admin with existing groups. Please use the "Lock Admin" feature instead.')
    }

    // 2. Delete non-critical related records first
    await db.from('subscriptions').delete().eq('user_id', userId)
    await db.from('notifications').delete().eq('user_id', userId)

    // 3. Delete Supabase Auth user (cascades profile if FK is set, but we also manually clean it)
    const { error } = await this.supabase.getAdminClient().auth.admin.deleteUser(userId)
    if (error) {
      throw new Error(`Failed to delete auth user: ${error.message}`)
    }

    await db.from('profiles').delete().eq('user_id', userId)

    return { success: true }
  }

  async getEngagement() {
    const db = this.supabase.getAdminClient()

    // Weekly signups over the last 8 weeks
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
    const { data: recentProfiles } = await db
      .from('profiles')
      .select('created_at')
      .gte('created_at', eightWeeksAgo.toISOString())
      .order('created_at', { ascending: true })

    // Build weekly buckets
    const weekMap: Record<string, number> = {}
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const key = this.getISOWeek(d)
      weekMap[key] = 0
    }
    for (const p of recentProfiles ?? []) {
      const key = this.getISOWeek(new Date(p.created_at))
      if (key in weekMap) weekMap[key]++
    }
    const weeklySignups = Object.entries(weekMap).map(([week, count]) => ({ week, count }))

    // Plan distribution
    const { data: subs } = await db.from('subscriptions').select('plan, status')
    const planDistribution: Record<string, number> = { basic: 0, smart: 0, pro: 0 }
    const statusDistribution: Record<string, number> = { trialing: 0, active: 0, expired: 0, cancelled: 0, payment_failed: 0 }
    let trialCount = 0
    let activatedCount = 0
    for (const s of subs ?? []) {
      if (s.plan && planDistribution[s.plan] !== undefined) planDistribution[s.plan]++
      if (s.status && statusDistribution[s.status] !== undefined) statusDistribution[s.status]++
      if (s.status === SubscriptionStatus.TRIALING) trialCount++
      if (s.status === SubscriptionStatus.ACTIVE) activatedCount++
    }
    const totalSubUsers = trialCount + activatedCount
    const conversionRate = totalSubUsers > 0 ? Math.round((activatedCount / totalSubUsers) * 100) : 0

    // Avg groups per user
    const { count: totalGroups } = await db.from('groups').select('id', { count: 'exact', head: true })
    const { count: totalUsers } = await db.from('profiles').select('id', { count: 'exact', head: true })
    const avgGroupsPerUser = totalUsers && totalUsers > 0 ? Math.round(((totalGroups ?? 0) / totalUsers) * 10) / 10 : 0

    // Total members managed
    const { count: totalMembers } = await db.from('group_members').select('id', { count: 'exact', head: true }).eq('is_active', true)

    // Churned this month (status became expired/cancelled in last 30 days — best effort via updated_at if available)
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)

    return {
      weeklySignups,
      planDistribution,
      statusDistribution,
      conversionRate,
      avgGroupsPerUser,
      totalMembersManaged: totalMembers ?? 0,
    }
  }

  private getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }
}
