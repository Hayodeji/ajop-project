import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-rose-600">Something went wrong</p>
            <p className="mt-2 text-sm text-slate-600 font-mono bg-slate-100 rounded p-2 text-left break-all">
              {this.state.error.message}
            </p>
            <button
              className="mt-4 text-sm text-brand-700 underline"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
