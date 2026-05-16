import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { formatKobo } from '@/lib/utils'
import { Group } from '@/types'
import { useUiStore } from '@/stores/uiStore'

interface Props {
  group: Group
}

export const GroupHeader = ({ group }: Props) => {
  const openModal = useUiStore((s) => s.openModal)
  const publicUrl = `${window.location.origin}/g/${group.public_token}`

  return (
    <div>
      <Link to="/groups" className="text-sm text-gray-500 hover:text-gray-700">← Groups</Link>
      <div className="flex items-start justify-between mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {group.frequency} · {formatKobo(group.contribution_amount)} · Cycle #{group.current_cycle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openModal('edit-group')}
          >
            Edit Group
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(publicUrl) }}
          >
            Copy member link
          </Button>
        </div>
      </div>
    </div>
  )
}
