import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMembers, inviteMember, removeMember, updateMember } from '@/lib/api'
import toast from 'react-hot-toast'

export const useMembers = (groupId: string) =>
  useQuery({ queryKey: ['members', groupId], queryFn: () => getMembers(groupId), enabled: !!groupId })

export const useInviteMember = (groupId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phone: string; payoutPosition: number }) => inviteMember(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', groupId] })
      qc.invalidateQueries({ queryKey: ['contributions', groupId] })
      qc.invalidateQueries({ queryKey: ['groups', groupId] })
      toast.success('Member added')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to add member'),
  })
}

export const useRemoveMember = (groupId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', groupId] })
      qc.invalidateQueries({ queryKey: ['contributions', groupId] })
      qc.invalidateQueries({ queryKey: ['groups', groupId] })
      toast.success('Member removed')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to remove member'),
  })
}

export const useUpdateMember = (groupId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; name?: string; phone?: string; payout_position?: number }) => updateMember(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', groupId] })
      qc.invalidateQueries({ queryKey: ['contributions', groupId] })
      qc.invalidateQueries({ queryKey: ['groups', groupId] })
      toast.success('Member updated')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update member'),
  })
}
