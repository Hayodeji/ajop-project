import { useMemo } from 'react'

interface RotationScheduleProps {
  schedule: { position: number; member_name: string; collects_on_cycle: number }[]
  currentCycle: number
}

const RotationSchedule = ({ schedule, currentCycle }: RotationScheduleProps) => {
  const sorted = useMemo(() => [...schedule].sort((a, b) => a.position - b.position), [schedule])

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden text-white relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>
      
      <div className="p-6 border-b border-slate-700/50 flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Rotation Schedule</h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">The order of upcoming payouts</p>
        </div>
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner border border-slate-700">
          🔄
        </div>
      </div>
      
      <div className="p-6 relative z-10">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6 font-medium">No members in schedule yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sorted.map((item) => (
              <div key={item.position} className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-colors">
                <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold shadow-inner ${
                  item.collects_on_cycle === currentCycle ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 
                  item.collects_on_cycle < currentCycle ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 text-white'
                }`}>
                  {item.position}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold tracking-tight mb-0.5 ${
                    item.collects_on_cycle === currentCycle ? 'text-emerald-400' : 
                    item.collects_on_cycle < currentCycle ? 'text-slate-500' : 'text-slate-200'
                  }`}>{item.member_name}</p>
                  <p className="truncate text-xs font-medium text-slate-400">Cycle {item.collects_on_cycle}</p>
                </div>
                {item.collects_on_cycle === currentCycle && (
                  <span className="flex-shrink-0 inline-flex items-center rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                    Next
                  </span>
                )}
                {item.collects_on_cycle < currentCycle && (
                  <span className="flex-shrink-0 inline-flex items-center rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-700">
                    Done
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RotationSchedule;
