import { useEffect, useState } from 'react'

export function useInstallPrompt() {
  const [installable, setInstallable] = useState(false)
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstallable(false)
    setPrompt(null)
  }

  return { installable, install }
}
