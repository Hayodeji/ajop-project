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
  timeout: 30000,
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

// GraphQL Helper
const gql = async <T>(query: string, variables?: any): Promise<T> => {
  const response = await api.post('/graphql', { query, variables })
  if (response.data.errors) {
    const gqlError = response.data.errors[0]
    // NestJS wraps HTTP exceptions so the real message is in extensions.response.message
    // e.g. ConflictException → extensions.response.message: "A member with this phone number..."
    // The top-level message is just "Conflict" or "Forbidden" which is not user-friendly
    const message =
      gqlError?.extensions?.response?.message ||
      gqlError?.extensions?.originalError?.message ||
      gqlError?.message ||
      'Something went wrong.'
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }
  // The response from NestJS GraphQL is usually { data: { operationName: T } }
  // We return the first key of the data object
  const keys = Object.keys(response.data.data)
  return response.data.data[keys[0]]
}

// Auth
export const checkPhone = (phone: string) =>
  gql<{ success: boolean; message: string }>(`
    mutation CheckPhone($input: CheckPhoneInput!) {
      checkPhone(input: $input) { success message }
    }
  `, { input: { phone } })

export const completeProfile = (data: { name: string; email?: string; referralCode?: string }) =>
  gql<Profile>(`
    mutation CompleteProfile($input: CompleteProfileInput!) {
      completeProfile(input: $input) { id name email phone created_at }
    }
  `, { input: data })

export const getProfile = () =>
  gql<Profile>(`
    query GetProfile {
      profile { id name email phone created_at }
    }
  `)

export const forgotPassword = (data: { email?: string; phone?: string }) =>
  gql<{ success: boolean; message: string }>(`
    mutation ForgotPassword($input: ForgotPasswordInput!) {
      forgotPassword(input: $input) { success message }
    }
  `, { input: data })

export const resetPassword = (data: { password: string }) =>
  gql<{ success: boolean; message: string }>(`
    mutation ResetPassword($input: ResetPasswordInput!) {
      resetPassword(input: $input) { success message }
    }
  `, { input: data })

// Subscriptions
export const getMySubscription = () =>
  gql<Subscription | null>(`
    query MySubscription {
      mySubscription { id plan status expires_at }
    }
  `)

export const selectPlan = (plan: SubscriptionPlan) =>
  gql<Subscription>(`
    mutation SelectPlan($input: SelectPlanInput!) {
      selectPlan(input: $input) { id plan status expires_at }
    }
  `, { input: { plan } })

export const initiatePayment = (plan: SubscriptionPlan) =>
  gql<{ authorization_url: string; reference: string }>(`
    mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) { authorization_url reference }
    }
  `, { input: { plan } })

export const verifyPayment = (reference: string) =>
  gql<Subscription>(`
    mutation VerifyPayment($input: VerifyPaymentInput!) {
      verifyPayment(input: $input) { id plan status expires_at }
    }
  `, { input: { reference } })

// Groups
export const getGroups = () =>
  gql<Group[]>(`
    query Groups {
      groups { id name contribution_amount frequency member_count current_cycle created_at }
    }
  `)

export const createGroup = (data: { name: string; contribution_amount: number; frequency: string; member_count: number }) =>
  gql<Group>(`
    mutation CreateGroup($input: CreateGroupInput!) {
      createGroup(input: $input) { id name }
    }
  `, { input: { ...data, frequency: data.frequency.toUpperCase() } })

export const getGroup = (id: string) =>
  gql<Group>(`
    query Group($id: String!) {
      group(id: $id) { 
        id name contribution_amount frequency member_count current_cycle created_at 
        public_token
        rotation_schedule { position member_name collects_on_cycle }
      }
    }
  `, { id })

export const updateGroup = (id: string, data: Partial<Group>) => {
  const payload = { ...data, id }
  if (payload.frequency) {
    payload.frequency = payload.frequency.toUpperCase() as any
  }
  return gql<Group>(`
    mutation UpdateGroup($input: UpdateGroupInput!) {
      updateGroup(input: $input) { id name }
    }
  `, { input: payload })
}

export const deleteGroup = (id: string) =>
  gql<boolean>(`
    mutation DeleteGroup($id: String!) {
      removeGroup(id: $id)
    }
  `, { id })

// Members
export const getMembers = (groupId: string) =>
  gql<GroupMember[]>(`
    query Members($groupId: ID!) {
      members(groupId: $groupId) { id name phone payout_position is_active }
    }
  `, { groupId })

export const inviteMember = (groupId: string, data: { name: string; phone: string; payoutPosition: number }) =>
  gql<GroupMember>(`
    mutation InviteMember($input: CreateMemberInput!) {
      inviteMember(input: $input) { id name }
    }
  `, { 
    input: { 
      name: data.name,
      phone: data.phone,
      group_id: groupId, 
      payout_position: data.payoutPosition 
    } 
  })

export const removeMember = (groupId: string, memberId: string) =>
  gql<boolean>(`
    mutation RemoveMember($id: String!) {
      removeMember(id: $id)
    }
  `, { id: memberId })

export const updateMember = (data: { id: string; name?: string; phone?: string; payout_position?: number }) =>
  gql<GroupMember>(`
    mutation UpdateMember($input: UpdateMemberInput!) {
      updateMember(input: $input) { id name phone payout_position }
    }
  `, { input: data })

// Contributions
export const getContributions = (groupId: string, from?: string, to?: string) =>
  gql<Contribution[]>(`
    query Contributions($groupId: ID!, $fromDate: String, $toDate: String) {
      contributions(groupId: $groupId, fromDate: $fromDate, toDate: $toDate) { 
        id member_id cycle_number status paid_at due_date
        member { name phone }
      }
    }
  `, { groupId, fromDate: from, toDate: to })

export const markContribution = (groupId: string, data: { memberId: string; cycleNumber: number; status: ContributionStatus }) =>
  gql<Contribution>(`
    mutation MarkContribution($input: CreateContributionInput!) {
      markContribution(input: $input) { id status }
    }
  `, { 
    input: { 
      group_id: groupId, 
      member_id: data.memberId, 
      cycle_number: data.cycleNumber, 
      status: data.status 
    } 
  })

// Payouts
export const getPayouts = (groupId: string) =>
  gql<Payout[]>(`
    query Payouts($groupId: ID!) {
      payouts(groupId: $groupId) { 
        id member_id cycle_number amount created_at receipt_url
        member { name phone }
      }
    }
  `, { groupId })

export const recordPayout = (groupId: string, data: { memberId: string; cycleNumber: number; amount: number }) =>
  gql<Payout>(`
    mutation RecordPayout($input: CreatePayoutInput!) {
      recordPayout(input: $input) { id amount }
    }
  `, { 
    input: { 
      group_id: groupId, 
      member_id: data.memberId, 
      cycle_number: data.cycleNumber, 
      amount: data.amount 
    } 
  })

// Public
export const getPublicGroup = (token: string) =>
  gql<any>(`
    query PublicGroup($token: String!) {
      publicGroup(token: $token) {
        group { id name contribution_amount frequency member_count current_cycle }
        members { id name phone payout_position is_active }
        contributions { id member_id cycle_number status paid_at }
      }
    }
  `, { token })
