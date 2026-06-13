import { useEffect, useState } from 'react'

// Evento não-padrão do Chrome/Android para instalar PWA.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-prompt-dispensado'

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [podeInstalar, setPodeInstalar] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [standalone, setStandalone] = useState(true)

  useEffect(() => {
    const ehStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari iOS expõe navigator.standalone
      (navigator as unknown as { standalone?: boolean }).standalone === true
    setStandalone(ehStandalone)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const onPrompt = (e: Event) => {
      e.preventDefault() // impede o mini-infobar padrão; controlamos o momento
      setDeferred(e as BeforeInstallPromptEvent)
      setPodeInstalar(true)
    }
    const onInstalado = () => {
      setPodeInstalar(false)
      setDeferred(null)
      setStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalado)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalado)
    }
  }, [])

  async function instalar(): Promise<boolean> {
    if (!deferred) return false
    await deferred.prompt()
    const escolha = await deferred.userChoice
    setDeferred(null)
    setPodeInstalar(false)
    return escolha.outcome === 'accepted'
  }

  const jaDispensou = () => localStorage.getItem(DISMISS_KEY) === '1'
  const dispensar = () => localStorage.setItem(DISMISS_KEY, '1')

  return { podeInstalar, isIOS, standalone, instalar, jaDispensou, dispensar }
}
