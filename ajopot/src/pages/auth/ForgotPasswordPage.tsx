import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { forgotPassword } from '@/lib/api'

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)

  const formik = useFormik({
    initialValues: { phone: '' },
    validationSchema: Yup.object({
      phone: Yup.string().required('Phone number is required'),
    }),
    onSubmit: async (values) => {
      try {
        await forgotPassword({ phone: values.phone })
        setSent(true)
        toast.success('Verification code sent to your phone')
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to send verification code')
      }
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            return to login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Code Sent</h3>
              <p className="mt-2 text-sm text-gray-500">
                Check your phone for a verification code. Use it to log in and update your password in settings.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={formik.handleSubmit}>
              <Input
                label="Phone Number"
                id="phone"
                type="tel"
                placeholder="+2348000000000"
                {...formik.getFieldProps('phone')}
                error={formik.touched.phone && formik.errors.phone ? formik.errors.phone : undefined}
              />

              <Button type="submit" fullWidth loading={formik.isSubmitting}>
                Send Verification Code
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}


export default ForgotPasswordPage;
