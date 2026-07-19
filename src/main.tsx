import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { AppErrorBoundary } from './components/errors/AppErrorBoundary'
import { ThemeProvider } from './features/theme/ThemeProvider'
import './styles.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AppErrorBoundary><App /></AppErrorBoundary>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
