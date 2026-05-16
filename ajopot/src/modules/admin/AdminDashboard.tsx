import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminGetStats, adminGetActivity } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'
import { StatsGrid } from './StatsGrid'
import { ActivityList } from './ActivityList'

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats })
  const { data: activity } = useQuery({ queryKey: ['admin-activity'], queryFn: adminGetActivity })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Live snapshot of AjoPot activity</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link to="/admin/engagement" className="text-green-400 text-xs hover:underline">View all engagement</Link>
          </div>
          <ActivityList activity={activity ?? []} />
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Engagement Pulse</h2>
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-3 border-b border-slate-800">
               <span className="text-slate-400 text-sm">Active Groups</span>
               <span className="text-white font-bold">{stats?.totalGroups ?? stats?.total_groups ?? 0}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-slate-800">
               <span className="text-slate-400 text-sm">Member Capacity</span>
               <span className="text-white font-bold">{stats?.totalMembers ?? stats?.total_members ?? 0}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-slate-800">
               <span className="text-slate-400 text-sm">Growth Rate</span>
               <span className="text-green-400 font-bold">+12%</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-400 text-sm">Platform Health</span>
               <span className="text-green-500 font-bold text-xs uppercase bg-green-500/10 px-2 py-1 rounded-full">Excellent</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
