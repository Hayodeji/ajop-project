import { useState } from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/api'
import { normalisePhone, isValidNigerianPhone } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type Mode = 'signin' | 'signup'

const signInSchema = Yup.object({
  phone: Yup.string()
    .required('Enter your phone number')
    .test('nigerian', 'Enter a valid Nigerian phone number', (v) =>
      isValidNigerianPhone(normalisePhone(v ?? '')),
    ),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Enter your password'),
})

const signUpSchema = Yup.object({
  phone: Yup.string()
    .required('Enter your phone number')
    .test('nigerian', 'Enter a valid Nigerian phone number', (v) =>
      isValidNigerianPhone(normalisePhone(v ?? '')),
    ),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Create a password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
})

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  if (session) return <Navigate to="/dashboard" replace />

  const isSignUp = mode === 'signup'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white font-bold text-xl mb-4">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to AjoPot</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignUp
              ? 'Create your account to get started'
              : 'Sign in to manage your savings groups'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isSignUp
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isSignUp
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Create account
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
          <Formik
            key={mode}
            initialValues={{ phone: '', password: '', confirmPassword: '' }}
            validationSchema={isSignUp ? signUpSchema : signInSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const phone = normalisePhone(values.phone)

                if (isSignUp) {
                  const { error } = await supabase.auth.signUp({
                    phone,
                    password: values.password,
                  })
                  if (error) throw new Error(error.message)
                  toast.success('Account created! Tell us your name.')
                  navigate('/signup', { replace: true })
                } else {
                  const { error } = await supabase.auth.signInWithPassword({
                    phone,
                    password: values.password,
                  })
                  if (error) throw new Error(error.message)

                  // Check super-admin access first
                  try {
                    const { adminGetStats } = await import('@/lib/adminApi')
                    await adminGetStats()
                    toast.success('Welcome, Super Admin')
                    navigate('/admin/dashboard', { replace: true })
                    return
                  } catch {
                    // Not a super-admin, continue normal flow
                  }

                  // Check if profile is complete
                  try {
                    const profile = await getProfile()
                    if (!profile) {
                      navigate('/signup', { replace: true })
                    } else {
                      toast.success('Welcome back!')
                      navigate('/dashboard', { replace: true })
                    }
                  } catch {
                    navigate('/signup', { replace: true })
                  }
                }
              } catch (err) {
                const msg =
                  err instanceof Error ? err.message : 'Something went wrong. Try again.'
                toast.error(msg)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
              <Form className="space-y-4">
                <Input
                  label="Phone number"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0801 234 5678"
                  leftAdornment={
                    <>
                      🇳🇬 <span className="ml-1">+234</span>
                    </>
                  }
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone ? errors.phone : undefined}
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password ? errors.password : undefined}
                />
                {isSignUp && (
                  <Input
                    label="Confirm password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword ? errors.confirmPassword : undefined}
                  />
                )}
                <Button type="submit" loading={isSubmitting} fullWidth size="lg" className="mt-2">
                  {isSignUp ? 'Create account' : 'Sign in'}
                </Button>
              </Form>
            )}
          </Formik>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  )
}
