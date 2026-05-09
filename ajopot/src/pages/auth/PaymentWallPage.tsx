import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { initiatePayment } from '@/lib/api'
import toast from 'react-hot-toast'

interface PaymentWallPageProps {
  subscription: any
}

const PaymentWallPage = ({ subscription }: PaymentWallPageProps) => {
  const [loading, setLoading] = useState(false)

  const handleUpdateCard = async () => {
    setLoading(true)
    try {
      const { authorization_url } = await initiatePayment(subscription.plan)
      window.location.href = authorization_url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start payment. Try again.'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          We couldn't process the payment for your <span className="font-semibold capitalize">{subscription.plan}</span> plan. 
          Please update your card details to restore access to your groups.
        </p>
        <div className="space-y-4">
          <Button fullWidth onClick={handleUpdateCard} loading={loading}>
            Update Card Details
          </Button>
          <p className="text-xs text-gray-400">
            You will be redirected to Paystack to securely vault your card. 
            A temporary charge of ₦100 may be applied and refunded.
          </p>
        </div>
      </div>
    </div>
  )
}


export default PaymentWallPage;
