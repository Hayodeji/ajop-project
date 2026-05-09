import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateGroup } from '@/hooks/useGroups'
import { nairaToKobo } from '@/lib/utils'
import { GroupFrequency } from '@/types'

const schema = Yup.object({
  name: Yup.string().min(2).max(100).required('Group name is required'),
  contributionAmount: Yup.number().min(100, 'Minimum ₦100').required('Amount is required'),
  frequency: Yup.mixed<GroupFrequency>().oneOf(['weekly', 'biweekly', 'monthly']).required(),
  memberCount: Yup.number().min(2).max(100).required('Member count is required'),
})

interface Props {
  open: boolean
  onClose: () => void
}

const CreateGroupModal = ({ open, onClose }: Props) => {
  const { mutate: create, isPending } = useCreateGroup()

  const formik = useFormik({
    initialValues: {
      name: '',
      contributionAmount: '',
      frequency: 'monthly' as GroupFrequency,
      memberCount: '',
    },
    validationSchema: schema,
    onSubmit: (values, helpers) => {
      create(
        {
          name: values.name,
          contribution_amount: nairaToKobo(Number(values.contributionAmount)),
          frequency: values.frequency,
          member_count: Number(values.memberCount),
        },
        { onSuccess: () => { helpers.resetForm(); onClose() } },
      )
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          placeholder="e.g. Alakuko Ajo Group"
          {...formik.getFieldProps('name')}
          error={formik.touched.name ? formik.errors.name : undefined}
        />
        <Input
          label="Contribution amount (₦)"
          type="number"
          placeholder="e.g. 5000"
          {...formik.getFieldProps('contributionAmount')}
          error={formik.touched.contributionAmount ? formik.errors.contributionAmount : undefined}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
          <select
            {...formik.getFieldProps('frequency')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <Input
          label="Number of members"
          type="number"
          placeholder="e.g. 12"
          {...formik.getFieldProps('memberCount')}
          error={formik.touched.memberCount ? formik.errors.memberCount : undefined}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isPending}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}


export default CreateGroupModal;
