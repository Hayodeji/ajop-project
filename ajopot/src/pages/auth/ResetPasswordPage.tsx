import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { resetPassword } from '@/lib/api'

const ResetPasswordPage = () => {
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        await resetPassword({ password: values.password })
        toast.success('Password updated successfully')
        navigate('/dashboard')
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to reset password')
      }
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Set new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            <Input
              label="New Password"
              id="password"
              type="password"
              {...formik.getFieldProps('password')}
              error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
            />

            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              {...formik.getFieldProps('confirmPassword')}
              error={formik.touched.confirmPassword && formik.errors.confirmPassword ? formik.errors.confirmPassword : undefined}
            />

            <Button type="submit" fullWidth loading={formik.isSubmitting}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}


export default ResetPasswordPage;
