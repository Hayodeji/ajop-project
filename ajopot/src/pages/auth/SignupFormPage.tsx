import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { completeProfile } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = Yup.object({
  name: Yup.string().min(2, 'Name too short').max(100).required('Name is required'),
  referralCode: Yup.string().max(20).optional(),
})

export default function SignupFormPage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: completeProfile,
    onSuccess: () => {
      toast.success('Profile created!')
      navigate('/plan-select')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save profile'),
  })

  const formik = useFormik({
    initialValues: { name: '', referralCode: '' },
    validationSchema: schema,
    onSubmit: (values) => {
      mutation.mutate({ name: values.name, referralCode: values.referralCode || undefined })
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to AjoPot</h1>
          <p className="text-gray-500 mt-2">Tell us your name to get started</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <Input
              label="Your full name"
              placeholder="e.g. Chioma Okafor"
              {...formik.getFieldProps('name')}
              error={formik.touched.name ? formik.errors.name : undefined}
            />
            <Input
              label="Referral code (optional)"
              placeholder="e.g. ABC123"
              hint="Enter a friend's referral code if you have one"
              {...formik.getFieldProps('referralCode')}
              error={formik.touched.referralCode ? formik.errors.referralCode : undefined}
            />
            <Button type="submit" fullWidth loading={mutation.isPending} className="mt-2">
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
