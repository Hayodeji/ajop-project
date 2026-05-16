import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

export const ProfileInfo = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  return (
    <Card className="p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
          <p className="text-lg font-medium text-slate-900">{profile?.name || '—'}</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
          <p className="text-lg font-medium text-slate-900">{profile?.phone || '—'}</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
          <p className="text-lg font-medium text-slate-900">{profile?.email || '—'}</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Created</label>
          <p className="text-lg font-medium text-slate-900">{profile?.created_at ? formatDate(profile.created_at) : '—'}</p>
        </div>
      </div>
      
      <div className="mt-10 p-4 bg-brand-50 rounded-xl border border-brand-100">
        <p className="text-sm text-brand-800">
          Need to change your profile details? Contact our support team to update your registered information.
        </p>
      </div>
    </Card>
  )
}
