import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tailwind.css'
import { validateEnv } from './utils/envValidation'

// Validate environment variables on app startup
try {
  validateEnv()
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  console.error('Environment validation failed:', errorMessage)
  // In production, you might want to show a user-friendly error page
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="color: #6b7280;">${errorMessage}</p>
          <p style="color: #6b7280; margin-top: 1rem; font-size: 0.875rem;">
            Please check your environment variables and try again.
          </p>
        </div>
      </div>
    `
    throw error
  }
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

