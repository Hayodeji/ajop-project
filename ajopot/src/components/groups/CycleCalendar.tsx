import { useMemo } from 'react'
import { Contribution } from '@/types'

interface CycleCalendarProps {
  contributions: Contribution[]
  currentCycle: number
}

const CycleCalendar = ({ contributions, currentCycle }: CycleCalendarProps) => {
  const currentContributions = useMemo(() => {
    return contributions.filter(c => c.cycle_number === currentCycle)
  }, [contributions, currentCycle])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50 pointer-events-none"></div>
      
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Cycle {currentCycle} Tracker</h3>
          <p className="text-sm text-gray-500 mt-1">Active collection progress</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-xl shadow-inner border border-emerald-200">
          ⏳
        </div>
      </div>
      
      <div className="p-6 bg-gray-50/30">
        {currentContributions.length === 0 ? (
          <p className="text-sm text-gray-500 font-medium text-center py-6">No active contributions for this cycle.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentContributions.map(c => {
              const dateStr = c.due_date ? new Date(c.due_date).toLocaleDateString() : 'N/A'
              return (
                <div key={c.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight mb-1">{c.member?.name || 'Unknown'}</p>
                    <p className="text-xs font-medium text-gray-500">Due: <span className="text-gray-700">{dateStr}</span></p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      c.status.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      c.status.toLowerCase() === 'late' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CycleCalendar;
