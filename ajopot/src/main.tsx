import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          fontSize: '14px',
          borderRadius: '10px',
        },
      }}
    />
  </StrictMode>,
)
