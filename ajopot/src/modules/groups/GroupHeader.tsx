import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { formatKobo } from '@/lib/utils'
import { Group } from '@/types'
import { useUiStore } from '@/stores/uiStore'
import { sendReminders, extractErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

interface Props {
  group: Group
}

export const GroupHeader = ({ group }: Props) => {
  const [loading, setLoading] = useState(false)
  const openModal = useUiStore((s) => s.openModal)
  const publicUrl = `${window.location.origin}/g/${group.public_token}`

  const handleSendReminders = async () => {
    setLoading(true)
    try {
      await sendReminders(group.id)
      toast.success('WhatsApp reminders sent!')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const totalPot = group.contribution_amount * group.member_count

  return (
    <div className="mb-8">
      <Link to="/groups" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mb-6 group">
        <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Groups
      </Link>
      
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 p-8 sm:p-10 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-100">Cycle #{group.current_cycle}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {group.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 mt-2 bg-black/20 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
              <div>
                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest mb-1.5">Per Cycle</p>
                <p className="text-2xl font-bold text-white">{formatKobo(group.contribution_amount)}</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest mb-1.5">Frequency</p>
                <p className="text-xl font-bold text-white capitalize pt-0.5">{group.frequency}</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest mb-1.5">Total Pot</p>
                <p className="text-2xl font-extrabold text-emerald-300 drop-shadow-sm">{formatKobo(totalPot)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleSendReminders()}
              loading={loading}
              className="bg-[#25D366] hover:bg-[#1fa14d] text-white border-none shadow-lg shadow-green-900/40 font-bold tracking-wide px-5 py-2.5 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 rounded-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Remind Members
            </Button>
            <Button
              variant="outline"
              onClick={async () => { 
                try {
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(publicUrl)
                    toast.success('Member link copied!')
                  } else {
                    const textArea = document.createElement("textarea")
                    textArea.value = publicUrl
                    document.body.appendChild(textArea)
                    textArea.select()
                    try {
                      document.execCommand('copy')
                      toast.success('Member link copied!')
                    } catch (err) {
                      toast.error('Failed to copy link')
                    }
                    document.body.removeChild(textArea)
                  }
                } catch (e) {
                  toast.error('Failed to copy link')
                }
              }}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium"
            >
              🔗 Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal('edit-group')}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium"
            >
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
