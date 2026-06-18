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
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 shadow-md">
        {/* Decorative Top Banner */}
        <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 absolute top-0 left-0 right-0" />

        <div className="relative pt-12 px-8 pb-8">
          {/* Avatar Area */}
          <div className="flex items-end gap-5 mb-8">
            <div className="h-24 w-24 mt-4 rounded-full bg-white p-1.5 shadow-sm border border-slate-100">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {profile?.name || 'Complete your profile'}
              </h2>
              <p className="text-sm font-medium text-slate-500">Ajo Manager</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 mt-4 bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-slate-300">📱</span> Phone Number
              </label>
              <p className="text-lg font-semibold text-slate-900">{profile?.phone || '—'}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-slate-300">✉️</span> Email Address
              </label>
              <p className="text-lg font-semibold text-slate-900">{profile?.email || '—'}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-slate-300">📅</span> Account Created
              </label>
              <p className="text-base font-medium text-slate-700">
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="p-5 bg-green-50/80 rounded-2xl border border-green-100 flex items-start gap-4">
        <div className="text-2xl pt-0.5">💬</div>
        <div>
          <h4 className="text-sm font-bold text-green-900 mb-1">Need to update your details?</h4>
          <p className="text-sm text-green-800/80 leading-relaxed">
            For security reasons, direct profile edits are restricted. Please contact our support team if you need to update your registered phone number or email address.
          </p>
        </div>
      </div>
    </div>
  )
}
