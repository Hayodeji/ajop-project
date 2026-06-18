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
  bank_name: Yup.string().nullable(),
  account_number: Yup.string().nullable().matches(/^[0-9]{10}$/, 'Account number must be 10 digits'),
  account_name: Yup.string().nullable(),
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
    initialValues: { 
      name: member.name, 
      phone: member.phone,
      bank_name: member.bank_name || '',
      account_number: member.account_number || '',
      account_name: member.account_name || ''
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values) => {
      update(
        {
          id: member.id,
          name: values.name,
          phone: normalisePhone(values.phone),
          bank_name: values.bank_name || undefined,
          account_number: values.account_number || undefined,
          account_name: values.account_name || undefined,
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

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bank Details (Optional)</p>
          <div className="space-y-4">
            <Input
              label="Bank Name"
              placeholder="e.g. GTBank"
              {...formik.getFieldProps('bank_name')}
              error={formik.touched.bank_name ? formik.errors.bank_name : undefined}
            />
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Account Number"
                placeholder="10 digits"
                {...formik.getFieldProps('account_number')}
                error={formik.touched.account_number ? formik.errors.account_number : undefined}
              />
              <Input
                label="Account Name"
                placeholder="Name on bank account"
                {...formik.getFieldProps('account_name')}
                error={formik.touched.account_name ? formik.errors.account_name : undefined}
              />
            </div>
          </div>
        </div>
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
