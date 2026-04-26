import { api } from './api'

export const adminGetStats = () =>
  api.get('/admin/stats').then(r => r.data.data)

export const adminGetUsers = (page = 1, search?: string) =>
  api.get('/admin/users', { params: { page, limit: 20, search } }).then(r => r.data.data)

export const adminGetUser = (userId: string) =>
  api.get(`/admin/users/${userId}`).then(r => r.data.data)

export const adminUpdateUser = (userId: string, body: { plan?: string; role?: string }) =>
  api.patch(`/admin/users/${userId}`, body).then(r => r.data.data)

export const adminGetGroups = (page = 1, search?: string) =>
  api.get('/admin/groups', { params: { page, limit: 20, search } }).then(r => r.data.data)

export const adminGetGroup = (groupId: string) =>
  api.get(`/admin/groups/${groupId}`).then(r => r.data.data)

export const adminGetSubscriptions = (page = 1) =>
  api.get('/admin/subscriptions', { params: { page, limit: 20 } }).then(r => r.data.data)

export const adminGetActivity = () =>
  api.get('/admin/activity').then(r => r.data.data)
