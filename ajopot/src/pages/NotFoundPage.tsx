import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          We couldn't find that page
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The link may be broken or the page may have moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  )
}
