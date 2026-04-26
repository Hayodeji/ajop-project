import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRecordPayout } from '@/hooks/usePayouts'
import { nairaToKobo } from '@/lib/utils'
import { GroupMember } from '@/types'

const schema = Yup.object({
  memberId: Yup.string().required('Select a member'),
  amount: Yup.number().min(1, 'Enter valid amount').required('Amount is required'),
})

interface Props {
  open: boolean
  onClose: () => void
  groupId: string
  members: GroupMember[]
  currentCycle: number
}

export default function RecordPayoutModal({ open, onClose, groupId, members, currentCycle }: Props) {
  const { mutate: record, isPending } = useRecordPayout(groupId)

  const formik = useFormik({
    initialValues: { memberId: '', amount: '' },
    validationSchema: schema,
    onSubmit: (values, helpers) => {
      record(
        {
          memberId: values.memberId,
          cycleNumber: currentCycle,
          amount: nairaToKobo(Number(values.amount)),
        },
        { onSuccess: () => { helpers.resetForm(); onClose() } },
      )
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Record Payout" size="sm">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Member</label>
          <select
            {...formik.getFieldProps('memberId')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
          >
            <option value="">Select member...</option>
            {members
              .filter((m) => m.is_active)
              .sort((a, b) => a.payout_position - b.payout_position)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.payout_position}. {m.name}
                </option>
              ))}
          </select>
          {formik.touched.memberId && formik.errors.memberId && (
            <p className="text-rose-600 text-xs mt-1.5">{formik.errors.memberId}</p>
          )}
        </div>
        <Input
          label="Payout amount (₦)"
          type="number"
          placeholder="e.g. 50000"
          {...formik.getFieldProps('amount')}
          error={formik.touched.amount ? formik.errors.amount : undefined}
        />
        <p className="text-xs text-gray-400">Cycle #{currentCycle}</p>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isPending}>
            Record Payout
          </Button>
        </div>
      </form>
    </Modal>
  )
}
