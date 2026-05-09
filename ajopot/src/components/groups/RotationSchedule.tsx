import { useMemo } from 'react'

interface RotationScheduleProps {
  schedule: { position: number; member_name: string; collects_on_cycle: number }[]
  currentCycle: number
}

const RotationSchedule = ({ schedule, currentCycle }: RotationScheduleProps) => {
  const sorted = useMemo(() => [...schedule].sort((a, b) => a.position - b.position), [schedule])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rotation Schedule</h3>
      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200">
          {sorted.map((item) => (
            <li key={item.position} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${item.collects_on_cycle === currentCycle ? 'bg-green-100 text-green-700' : item.collects_on_cycle < currentCycle ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                    {item.position}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.member_name}</p>
                  <p className="truncate text-sm text-gray-500">Collects on Cycle {item.collects_on_cycle}</p>
                </div>
                <div>
                  {item.collects_on_cycle === currentCycle && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Collecting Next
                    </span>
                  )}
                  {item.collects_on_cycle < currentCycle && (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {sorted.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No members in schedule yet.</p>}
      </div>
    </div>
  )
}


export default RotationSchedule;
