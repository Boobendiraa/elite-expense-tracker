import { StrictMode, Suspense, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LockScreen from './components/LockScreen.jsx'
import { isPasscodeEnabled } from './storage/index.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-2 border-teal-500 border-t-transparent loading-spinner" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

function AppWrapper() {
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(() => !isPasscodeEnabled())

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  if (!ready) return <LoadingScreen />
  if (isPasscodeEnabled() && !unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <AppWrapper />
    </Suspense>
  </StrictMode>,
)
