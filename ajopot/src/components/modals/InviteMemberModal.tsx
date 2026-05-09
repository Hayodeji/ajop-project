import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useInviteMember } from '@/hooks/useMembers'
import { normalisePhone, isValidNigerianPhone } from '@/lib/utils'

const schema = Yup.object({
  name: Yup.string().min(2).max(100).required('Name is required'),
  phone: Yup.string()
    .test('nigerian', 'Enter a valid Nigerian phone number', (v) => isValidNigerianPhone(normalisePhone(v ?? '')))
    .required('Phone is required'),
  payoutPosition: Yup.number().min(1).required('Payout position is required'),
})

interface Props {
  open: boolean
  onClose: () => void
  groupId: string
  memberCount: number
}

const InviteMemberModal = ({ open, onClose, groupId, memberCount }: Props) => {
  const { mutate: invite, isPending } = useInviteMember(groupId)

  const formik = useFormik({
    initialValues: { name: '', phone: '', payoutPosition: memberCount + 1 },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, helpers) => {
      invite(
        {
          name: values.name,
          phone: normalisePhone(values.phone),
          payoutPosition: Number(values.payoutPosition),
        },
        { onSuccess: () => { helpers.resetForm(); onClose() } },
      )
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Add Member" size="sm">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          placeholder="e.g. Emeka Nwosu"
          {...formik.getFieldProps('name')}
          error={formik.touched.name ? formik.errors.name : undefined}
        />
        <Input
          label="Phone number"
          placeholder="e.g. 08012345678"
          {...formik.getFieldProps('phone')}
          error={formik.touched.phone ? formik.errors.phone : undefined}
        />
        <Input
          label="Payout position"
          type="number"
          hint="Order in which this member receives the pot"
          {...formik.getFieldProps('payoutPosition')}
          error={formik.touched.payoutPosition ? formik.errors.payoutPosition : undefined}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isPending}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  )
}


export default InviteMemberModal;
