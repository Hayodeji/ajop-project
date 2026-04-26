import axios, { AxiosError } from 'axios'
import type {
  ApiError,
  ApiResponse,
  Profile,
  Subscription,
  SubscriptionPlan,
  Group,
  GroupMember,
  Contribution,
  ContributionStatus,
  Payout,
} from '@/types'
import { supabase } from './supabase'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = (err as AxiosError<ApiError>).response?.data
    return body?.error?.message ?? err.message ?? 'Something went wrong.'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong.'
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

// Auth
export const checkPhone = (phone: string) =>
  api.post<ApiResponse<{ isNewUser: boolean }>>('/auth/check-phone', { phone }).then(r => r.data.data)

export const completeProfile = (data: { name: string; referralCode?: string }) =>
  api.post<ApiResponse<Profile>>('/auth/complete-profile', data).then(r => r.data.data)

export const getProfile = () =>
  api.get<ApiResponse<Profile>>('/auth/profile').then(r => r.data.data)

// Subscriptions
export const getMySubscription = () =>
  api.get<ApiResponse<Subscription | null>>('/subscriptions/me').then(r => r.data.data)

export const selectPlan = (plan: SubscriptionPlan) =>
  api.post<ApiResponse<Subscription>>('/subscriptions/select', { plan }).then(r => r.data.data)

export const initiatePayment = (plan: SubscriptionPlan) =>
  api.post<ApiResponse<{ authorization_url: string; access_code: string; reference: string }>>('/subscriptions/pay', { plan }).then(r => r.data.data)

export const verifyPayment = (reference: string) =>
  api.post<ApiResponse<{ plan: string; status: string }>>('/subscriptions/verify', { reference }).then(r => r.data.data)

// Groups
export const getGroups = () =>
  api.get<ApiResponse<Group[]>>('/groups').then(r => r.data.data)

export const createGroup = (data: { name: string; contribution_amount: number; frequency: string; member_count: number }) =>
  api.post<ApiResponse<Group>>('/groups', data).then(r => r.data.data)

export const getGroup = (id: string) =>
  api.get<ApiResponse<Group>>(`/groups/${id}`).then(r => r.data.data)

export const updateGroup = (id: string, data: Partial<Group>) =>
  api.patch<ApiResponse<Group>>(`/groups/${id}`, data).then(r => r.data.data)

export const deleteGroup = (id: string) =>
  api.delete(`/groups/${id}`)

// Members
export const getMembers = (groupId: string) =>
  api.get<ApiResponse<GroupMember[]>>(`/groups/${groupId}/members`).then(r => r.data.data)

export const inviteMember = (groupId: string, data: { name: string; phone: string; payoutPosition: number }) =>
  api.post<ApiResponse<GroupMember>>(`/groups/${groupId}/members`, data).then(r => r.data.data)

export const removeMember = (groupId: string, memberId: string) =>
  api.delete(`/groups/${groupId}/members/${memberId}`)

// Contributions
export const getContributions = (groupId: string, from?: string, to?: string) => {
  const params = from && to ? `?from=${from}&to=${to}` : ''
  return api.get<ApiResponse<(Contribution & { group_members: Pick<GroupMember, 'name' | 'phone' | 'payout_position'> })[]>>(`/groups/${groupId}/contributions${params}`).then(r => r.data.data)
}

export const markContribution = (groupId: string, data: { memberId: string; cycleNumber: number; status: ContributionStatus }) =>
  api.post<ApiResponse<Contribution>>(`/groups/${groupId}/contributions`, data).then(r => r.data.data)

// Payouts
export const getPayouts = (groupId: string) =>
  api.get<ApiResponse<(Payout & { group_members: Pick<GroupMember, 'name' | 'phone' | 'payout_position'> })[]>>(`/groups/${groupId}/payouts`).then(r => r.data.data)

export const recordPayout = (groupId: string, data: { memberId: string; cycleNumber: number; amount: number }) =>
  api.post<ApiResponse<Payout>>(`/groups/${groupId}/payouts`, data).then(r => r.data.data)

// Public
export const getPublicGroup = (token: string) =>
  api.get<ApiResponse<{ group: Group; members: Pick<GroupMember, 'id' | 'name' | 'payout_position' | 'is_active'>[]; contributions: Pick<Contribution, 'id' | 'member_id' | 'cycle_number' | 'status' | 'paid_at'>[] }>>(`/public/${token}`).then(r => r.data.data)
