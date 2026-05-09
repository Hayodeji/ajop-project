import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUpdateMember } from '@/hooks/useMembers'
import { normalisePhone, isValidNigerianPhone } from '@/lib/utils'
import { GroupMember } from '@/types'

const schema = Yup.object({
  name: Yup.string().min(2).max(100).required('Name is required'),
  phone: Yup.string()
    .test('nigerian', 'Enter a valid Nigerian phone number', (v) => isValidNigerianPhone(normalisePhone(v ?? '')))
    .required('Phone is required'),
})

interface Props {
  open: boolean
  onClose: () => void
  groupId: string
  member: GroupMember
}

const EditMemberModal = ({ open, onClose, groupId, member }: Props) => {
  const { mutate: update, isPending } = useUpdateMember(groupId)

  const formik = useFormik({
    initialValues: { name: member.name, phone: member.phone },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values) => {
      update(
        {
          id: member.id,
          name: values.name,
          phone: normalisePhone(values.phone),
        },
        { onSuccess: onClose }
      )
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit Member" size="sm">
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
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditMemberModal;
