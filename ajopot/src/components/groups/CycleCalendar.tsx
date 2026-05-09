import { useMemo } from 'react'

interface CycleCalendarProps {
  contributions: {
    id: string
    cycle_number: number
    status: string
    due_date?: string
    group_members?: { name: string }
  }[]
  currentCycle: number
}

const CycleCalendar = ({ contributions, currentCycle }: CycleCalendarProps) => {
  const currentContributions = useMemo(() => {
    return contributions.filter(c => c.cycle_number === currentCycle)
  }, [contributions, currentCycle])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cycle {currentCycle} Calendar</h3>
      <div className="space-y-4">
        {currentContributions.map(c => {
          const dateStr = c.due_date ? new Date(c.due_date).toLocaleDateString() : 'N/A'
          return (
            <div key={c.id} className="flex items-center justify-between border-b border-gray-50 pb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.group_members?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Due: {dateStr}</p>
              </div>
              <div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  c.status === 'paid' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                  c.status === 'late' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                  'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                }`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
            </div>
          )
        })}
        {currentContributions.length === 0 && (
          <p className="text-sm text-gray-500 text-center">No contributions for this cycle.</p>
        )}
      </div>
    </div>
  )
}


export default CycleCalendar;
