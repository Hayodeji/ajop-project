import { useState } from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { useNavigate, Navigate, Link } from 'react-router-dom'
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

const LoginPage = () => {
  const [mode, setMode] = useState<Mode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  if (session) return <Navigate to="/dashboard" replace />

  const isSignUp = mode === 'signup'

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-green-100/50 blur-3xl animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-2xl mb-6 shadow-xl shadow-green-500/20">
            A
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AjoPot</h1>
          <p className="mt-3 text-slate-500 font-medium">
            {isSignUp
              ? 'Join thousands of smart savers today'
              : 'Sign in to your secure dashboard'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-slate-200/50 p-6 sm:p-10">
          {/* Mode toggle */}
          <div className="flex rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5 mb-8">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                !isSignUp
                  ? 'bg-white shadow-md text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isSignUp
                  ? 'bg-white shadow-md text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create account
            </button>
          </div>

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
                  toast.success('Account created! Let\'s finish your profile.')
                  navigate('/signup', { replace: true })
                } else {
                  const { error } = await supabase.auth.signInWithPassword({
                    phone,
                    password: values.password,
                  })
                  if (error) throw new Error(error.message)

                  // Check if super-admin
                  try {
                    const { adminGetStats } = await import('@/lib/adminApi')
                    await adminGetStats()
                    useAuthStore.getState().setIsAdmin(true)
                    toast.success('Welcome back, Admin')
                    navigate('/admin/dashboard', { replace: true })
                    return
                  } catch (err) {
                    // Not an admin, continue to user flow
                  }

                  // Regular user flow
                  try {
                    const profile = await getProfile()
                    if (!profile) {
                      navigate('/signup', { replace: true })
                    } else {
                      toast.success('Welcome back to AjoPot!')
                      navigate('/dashboard', { replace: true })
                    }
                  } catch {
                    navigate('/signup', { replace: true })
                  }
                }
              } catch (err) {
                const msg =
                  err instanceof Error ? err.message : 'Login failed. Please check your details.'
                toast.error(msg)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
              <Form className="space-y-5">
                <Input
                  label="Phone number"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0801 234 5678"
                  leftAdornment={
                    <div className="flex items-center text-slate-400 font-medium border-r border-slate-200 pr-3 mr-3">
                      <span className="text-lg mr-2">🇳🇬</span>
                      <span className="text-sm">+234</span>
                    </div>
                  }
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone ? errors.phone : undefined}
                />
                <div>
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password ? errors.password : undefined}
                    rightAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M15.171 11.586a4 4 0 111.414-1.414l2.121 2.121a1 1 0 01-1.414 1.414l-2.121-2.121z" />
                          </svg>
                        )}
                      </button>
                    }
                  />
                  {!isSignUp && (
                    <div className="mt-2 text-right">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </div>
                {isSignUp && (
                  <Input
                    label="Confirm password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword ? errors.confirmPassword : undefined}
                    rightAdornment={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M15.171 11.586a4 4 0 111.414-1.414l2.121 2.121a1 1 0 01-1.414 1.414l-2.121-2.121z" />
                          </svg>
                        )}
                      </button>
                    }
                  />
                )}
                <Button 
                  type="submit" 
                  loading={isSubmitting} 
                  fullWidth 
                  size="lg" 
                  className="mt-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border-none shadow-lg shadow-green-500/25 py-6 rounded-2xl text-base font-bold"
                >
                  {isSignUp ? 'Get Started' : 'Sign In'}
                </Button>
              </Form>
            )}
          </Formik>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 font-medium px-10 leading-relaxed">
         By continuing you agree to our 
          <a href="#" className="text-slate-600 hover:underline mx-1">Terms</a> and 
          <a href="#" className="text-slate-600 hover:underline ml-1">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}

export default LoginPage;
