import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminGetGroups } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'
import { formatKobo, formatDate } from '@/lib/utils'

export default function AdminGroups() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-groups', page, search],
    queryFn: () => adminGetGroups(page, search || undefined),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} total groups</p>
        </div>
        <input
          placeholder="Search group name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-60"
        />
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Group', 'Frequency', 'Amount', 'Members', 'Cycle', 'Created', 'Detail'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((g: any) => (
                <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-white font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{g.frequency}</td>
                  <td className="px-4 py-3 text-green-400 font-medium">{formatKobo(g.contribution_amount)}</td>
                  <td className="px-4 py-3 text-slate-300">{g.member_count}</td>
                  <td className="px-4 py-3 text-slate-300">#{g.current_cycle}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(g.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/groups/${g.id}`} className="text-green-400 hover:text-green-300 text-xs">View →</Link>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No groups found</td></tr>
              )}
            </tbody>
          </table>
          {(data?.total ?? 0) > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">Page {page}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Prev</button>
                <button disabled={page * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
