import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { ProfileInfo } from './ProfileInfo'
import { SubscriptionSettings } from './SubscriptionSettings'
import { FaqSection } from './FaqSection'

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'faq'>('profile')
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500">Manage your profile, subscription and find answers.</p>
        </div>
        <Button variant="ghost" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['profile', 'subscription', 'faq'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileInfo />}
        {activeTab === 'subscription' && <SubscriptionSettings />}
        {activeTab === 'faq' && <FaqSection />}
      </div>
    </div>
  )
}

export default ProfilePage
