import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getContributions, markContribution } from '@/lib/api'
import toast from 'react-hot-toast'
import { ContributionStatus } from '@/types'

export const useContributions = (groupId: string, from?: string, to?: string) =>
  useQuery({
    queryKey: ['contributions', groupId, from, to],
    queryFn: () => getContributions(groupId, from, to),
    enabled: !!groupId,
  })

export const useMarkContribution = (groupId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: string; cycleNumber: number; status: ContributionStatus }) =>
      markContribution(groupId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contributions', groupId] }); toast.success('Contribution updated') },
    onError: (e: any) => toast.error(e.message || 'Failed to update contribution'),
  })
}
