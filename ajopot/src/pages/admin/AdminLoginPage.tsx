import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { adminGetStats } from '@/lib/adminApi'
import { normalisePhone, isValidNigerianPhone } from '@/lib/utils'

const schema = Yup.object({
  phone: Yup.string()
    .required('Phone number required')
    .test('ng', 'Enter a valid Nigerian phone number', (v) =>
      isValidNigerianPhone(normalisePhone(v ?? '')),
    ),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password required'),
})

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const formik = useFormik({
    initialValues: { phone: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('')
      try {
        const phone = normalisePhone(values.phone)
        const { error: authError } = await supabase.auth.signInWithPassword({
          phone,
          password: values.password,
        })
        if (authError) throw new Error(authError.message)

        // Verify super-admin access by probing a protected endpoint
        try {
          await adminGetStats()
          toast.success('Welcome, Super Admin')
          navigate('/admin/dashboard', { replace: true })
        } catch {
          await supabase.auth.signOut()
          setError('Access denied. This account does not have super-admin privileges.')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed'
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-white font-bold text-2xl mb-4">
            A
          </div>
          <h1 className="text-xl font-bold text-white">AjoPot Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Super-admin access only</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone number</label>
              <input
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0906 554 3761"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-red-400 text-xs mt-1">{formik.errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-400 text-xs mt-1">{formik.errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
