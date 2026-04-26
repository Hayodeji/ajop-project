import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyPayment } from '@/lib/api'

type State = 'verifying' | 'success' | 'failed'

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>('verifying')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setState('failed')
      return
    }

    verifyPayment(reference)
      .then((data) => {
        setPlan(data.plan)
        setState('success')
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
      })
      .catch(() => setState('failed'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        {state === 'verifying' && (
          <>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="animate-spin h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verifying your payment…</h2>
            <p className="text-gray-500 text-sm mt-2">Please wait while we confirm your subscription.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment successful!</h2>
            <p className="text-gray-500 text-sm mt-2 capitalize">
              Your <strong>{plan}</strong> plan is now active. Redirecting to dashboard…
            </p>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment could not be verified</h2>
            <p className="text-gray-500 text-sm mt-2">
              If you were charged, contact support. Otherwise, try again.
            </p>
            <button
              onClick={() => navigate('/plan-select', { replace: true })}
              className="mt-6 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Back to plans
            </button>
          </>
        )}
      </div>
    </div>
  )
}
