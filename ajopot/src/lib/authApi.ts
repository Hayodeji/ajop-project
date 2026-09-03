import { api } from './api'
import type { Profile } from '@/types'

export interface AuthLoginInput {
  phone: string
  password: string
}

export interface AuthSignUpInput {
  phone: string
  password: string
  name?: string
  email?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: Profile
}

export const login = async (input: AuthLoginInput): Promise<AuthSession> => {
  const response = await api.post('/auth/login', input)
  return response.data
}

export const signup = async (input: AuthSignUpInput): Promise<AuthSession> => {
  const response = await api.post('/auth/signup', input)
  return response.data
}

export const refreshSession = async (refreshToken: string): Promise<{ accessToken: string }> => {
  const response = await api.post('/auth/refresh', { refreshToken })
  return response.data
}

export const logout = async (refreshToken: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/logout', { refreshToken })
  return response.data
}

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get('/auth/profile')
  return response.data
}
