import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetUsers, adminUpdateUser } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'
import { UsersTable } from './UsersTable'
import toast from 'react-hot-toast'

const AdminUsers = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminGetUsers(page, search || undefined),
  })

  const users = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  const total = typeof data?.total === 'number' ? data.total : users.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{total} registered ajo-admins</p>
        </div>
        <input
          placeholder="Search name or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-60"
        />
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {users.length ? (
            <UsersTable 
              users={users} 
            />
          ) : (
            <div className="text-center py-12 text-slate-500">No users found</div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Prev</button>
                <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminUsers
