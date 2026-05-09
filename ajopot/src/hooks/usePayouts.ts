import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPayouts, recordPayout } from '@/lib/api'
import toast from 'react-hot-toast'

export const usePayouts = (groupId: string) =>
  useQuery({ queryKey: ['payouts', groupId], queryFn: () => getPayouts(groupId), enabled: !!groupId })

export const useRecordPayout = (groupId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: string; cycleNumber: number; amount: number }) => recordPayout(groupId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payouts', groupId] }); toast.success('Payout recorded') },
    onError: (e: any) => toast.error(e.message || 'Failed to record payout'),
  })
}
