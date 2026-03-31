import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { Toaster } from './components/ui/sonner'

const savedTheme = localStorage.getItem('theme-storage')
if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme)
    if (parsed.state?.theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch (e) {
    console.error('Failed to parse theme from localStorage', e)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </React.StrictMode>,
)
