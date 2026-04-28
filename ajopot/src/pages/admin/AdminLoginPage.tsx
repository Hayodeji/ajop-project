import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { adminGetStats } from '@/lib/adminApi'
import { normalisePhone, isValidNigerianPhone } from '@/lib/utils'

type Mode = 'signin' | 'signup'

const signInSchema = Yup.object({
  phone: Yup.string()
    .required('Phone number required')
    .test('ng', 'Enter a valid Nigerian phone number', (v) =>
      isValidNigerianPhone(normalisePhone(v ?? '')),
    ),
  password: Yup.string().min(8, 'At least 8 characters').required('Password required'),
})

const signUpSchema = Yup.object({
  phone: Yup.string()
    .required('Phone number required')
    .test('ng', 'Enter a valid Nigerian phone number', (v) =>
      isValidNigerianPhone(normalisePhone(v ?? '')),
    ),
  password: Yup.string().min(8, 'At least 8 characters').required('Password required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
})

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [error, setError] = useState('')
  const isSignUp = mode === 'signup'

  const formik = useFormik({
    key: mode,
    initialValues: { phone: '', password: '', confirmPassword: '' },
    validationSchema: isSignUp ? signUpSchema : signInSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('')
      const phone = normalisePhone(values.phone)

      try {
        if (isSignUp) {
          const { error: authError } = await supabase.auth.signUp({
            phone,
            password: values.password,
          })
          if (authError) throw new Error(authError.message)

          // Verify this phone has super-admin access
          try {
            await adminGetStats()
            toast.success('Account created. Welcome, Super Admin!')
            navigate('/admin/dashboard', { replace: true })
          } catch {
            await supabase.auth.signOut()
            setError('Account created but this number is not authorised for admin access. Contact the platform owner.')
          }
        } else {
          const { error: authError } = await supabase.auth.signInWithPassword({
            phone,
            password: values.password,
          })
          if (authError) throw new Error(authError.message)

          try {
            await adminGetStats()
            toast.success('Welcome back, Super Admin')
            navigate('/admin/dashboard', { replace: true })
          } catch {
            await supabase.auth.signOut()
            setError('Access denied. This account does not have admin privileges.')
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    },
  } as any)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-white font-bold text-2xl mb-4 shadow-lg shadow-green-500/20">
            A
          </div>
          <h1 className="text-xl font-bold text-white">AjoPot Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Super-admin access only</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-1 mb-5">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isSignUp
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isSignUp
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 backdrop-blur">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-600 bg-slate-700 text-slate-300 text-sm">
                  🇳🇬 +234
                </span>
                <input
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0906 554 3761"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-r-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-red-400 text-xs mt-1">{formik.errors.phone as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-400 text-xs mt-1">{formik.errors.password as string}</p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{formik.errors.confirmPassword as string}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors mt-2"
            >
              {formik.isSubmitting
                ? isSignUp ? 'Creating account…' : 'Signing in…'
                : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Regular user?{' '}
          <a href="/login" className="text-slate-400 hover:text-white transition-colors">
            Go to user login
          </a>
        </p>
      </div>
    </div>
  )
}
