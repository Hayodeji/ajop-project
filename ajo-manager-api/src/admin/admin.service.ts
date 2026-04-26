import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

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
      db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trial'),
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
      .select('*, subscriptions(plan, status, trial_ends_at)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    // Get group counts per user
    const userIds = (data ?? []).map((u: any) => u.user_id)
    const { data: groupCounts } = await db
      .from('groups')
      .select('admin_id')
      .in('admin_id', userIds)

    const groupCountMap: Record<string, number> = {}
    for (const g of groupCounts ?? []) {
      groupCountMap[g.admin_id] = (groupCountMap[g.admin_id] ?? 0) + 1
    }

    return {
      data: (data ?? []).map((u: any) => ({
        ...u,
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
        .update({ plan: updates.plan, status: 'active' })
        .eq('user_id', userId)
      await db.from('profiles').update({ plan: updates.plan, is_pro: updates.plan === 'pro' }).eq('user_id', userId)
    }

    const { data } = await db.from('profiles').select('*').eq('user_id', userId).single()
    return data
  }

  async getGroups(page = 1, limit = 20, search?: string) {
    const db = this.supabase.getAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = db
      .from('groups')
      .select('*, profiles!groups_admin_id_fkey(name, phone), group_members(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) {
      // fallback without join if FK alias fails
      const fallback = await db
        .from('groups')
        .select('*, group_members(count)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      return { data: fallback.data ?? [], total: fallback.count ?? 0, page, limit }
    }

    return { data: data ?? [], total: count ?? 0, page, limit }
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
          .order('created_at', { ascending: false })
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
      .select('*, profiles(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)
    return { data: data ?? [], total: count ?? 0, page, limit }
  }

  async getActivity(limit = 50) {
    const db = this.supabase.getAdminClient()

    const [
      { data: recentUsers },
      { data: recentPayouts },
      { data: recentGroups },
      { data: recentSubs },
    ] = await Promise.all([
      db.from('profiles').select('user_id, name, phone, created_at').order('created_at', { ascending: false }).limit(10),
      db.from('payouts').select('id, amount, paid_out_at, group_id, group_members(name)').order('paid_out_at', { ascending: false }).limit(10),
      db.from('groups').select('id, name, admin_id, created_at').order('created_at', { ascending: false }).limit(10),
      db.from('subscriptions').select('id, user_id, plan, status, created_at, profiles(name, phone)').order('created_at', { ascending: false }).limit(10),
    ])

    const activity: any[] = []

    for (const u of recentUsers ?? []) {
      activity.push({ type: 'signup', label: `${u.name} signed up`, meta: u.phone, time: u.created_at })
    }
    for (const p of recentPayouts ?? []) {
      const member = (p.group_members as any)?.name ?? 'Unknown'
      activity.push({ type: 'payout', label: `Payout of ₦${((p.amount ?? 0) / 100).toLocaleString()} to ${member}`, meta: `Group ${p.group_id}`, time: p.paid_out_at })
    }
    for (const g of recentGroups ?? []) {
      activity.push({ type: 'group', label: `New group created: ${g.name}`, meta: g.admin_id, time: g.created_at })
    }
    for (const s of recentSubs ?? []) {
      const profile = (s.profiles as any)
      activity.push({ type: 'subscription', label: `${profile?.name ?? 'User'} selected ${s.plan} plan (${s.status})`, meta: profile?.phone ?? '', time: s.created_at })
    }

    return activity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit)
  }
}
