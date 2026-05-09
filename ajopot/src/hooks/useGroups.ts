import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createGroup, deleteGroup, getGroup, getGroups, updateGroup } from '@/lib/api'
import toast from 'react-hot-toast'
import { Group } from '@/types'

export const useGroups = () =>
  useQuery({ queryKey: ['groups'], queryFn: getGroups })

export const useGroup = (id: string) =>
  useQuery({ queryKey: ['groups', id], queryFn: () => getGroup(id), enabled: !!id })

export const useCreateGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group created') },
    onError: (e: any) => toast.error(e.message || 'Failed to create group'),
  })
}

export const useUpdateGroup = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Group>) => updateGroup(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups', id] }); toast.success('Group updated') },
    onError: (e: any) => toast.error(e.message || 'Failed to update group'),
  })
}

export const useDeleteGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group deleted') },
    onError: (e: any) => toast.error(e.message || 'Failed to delete group'),
  })
}
