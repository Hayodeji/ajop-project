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
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      try {
        await forgotPassword({ email: values.email })
        setSent(true)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to send reset email')
      }
    },
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white text-2xl font-bold mb-4">A</div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Remember it?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            Back to login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Check your email</h3>
              <p className="text-sm text-slate-500">
                We sent a password reset link to <span className="font-medium text-slate-700">{formik.values.email}</span>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-slate-400">Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-green-600 hover:underline">try again</button>.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={formik.handleSubmit}>
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Enter the email address linked to your account and we'll send you a reset link.
                </p>
                <Input
                  label="Email address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...formik.getFieldProps('email')}
                  error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
                />
              </div>
              <Button type="submit" fullWidth loading={formik.isSubmitting}>
                Send reset link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
