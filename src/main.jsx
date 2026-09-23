import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { captureAttribution } from './lib/attribution'
import './index.css'
import App from './App.jsx'

// Sebelum router jalan — redirect seperti /r/KODE membuang query string.
captureAttribution()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '6px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
