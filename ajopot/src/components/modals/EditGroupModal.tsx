import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUpdateGroup } from '@/hooks/useGroups'
import { Group } from '@/types'

const schema = Yup.object({
  name: Yup.string().min(2).max(100).required('Name is required'),
  member_count: Yup.number().min(2).required('Member limit is required'),
})

interface Props {
  open: boolean
  onClose: () => void
  group: Group
}

const EditGroupModal = ({ open, onClose, group }: Props) => {
  const { mutate: update, isPending } = useUpdateGroup(group.id)

  const formik = useFormik({
    initialValues: { 
      name: group.name, 
      member_count: group.member_count 
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values) => {
      update(
        { 
          name: values.name, 
          member_count: Number(values.member_count) 
        },
        { onSuccess: onClose }
      )
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit Group" size="sm">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          placeholder="e.g. Family Savings"
          {...formik.getFieldProps('name')}
          error={formik.touched.name ? formik.errors.name : undefined}
        />
        <Input
          label="Member limit"
          type="number"
          hint="Total slots available in this group"
          {...formik.getFieldProps('member_count')}
          error={formik.touched.member_count ? formik.errors.member_count : undefined}
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

export default EditGroupModal;
