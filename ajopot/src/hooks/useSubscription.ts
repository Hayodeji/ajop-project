import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMySubscription, selectPlan } from '@/lib/api'
import toast from 'react-hot-toast'
import { SubscriptionPlan } from '@/types'

export const useSubscription = () =>
  useQuery({ queryKey: ['subscription'], queryFn: getMySubscription })

export const useSelectPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plan: SubscriptionPlan) => selectPlan(plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); toast.success('Plan selected — 7-day trial started!') },
    onError: (e: any) => toast.error(e.message || 'Failed to select plan'),
  })
}
