import { useCallback, useEffect, useRef, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export type InstallStatus =
  | 'available'
  | 'unavailable'
  | 'installed'
  | 'ios-instructions'

type MediaQueryLike = {
  matches?: boolean
}

type NavigatorLike = {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

type WindowLike = {
  matchMedia?: (query: string) => MediaQueryLike
  navigator?: NavigatorLike
}

export function esStandalone(
  matchMediaFn: ((query: string) => MediaQueryLike) | undefined,
  nav: NavigatorLike,
): boolean {
  if (nav.standalone === true) {
    return true
  }
  if (matchMediaFn === undefined) {
    return false
  }
  try {
    if (matchMediaFn('(display-mode: standalone)').matches === true) {
      return true
    }
  } catch {
    return false
  }
  try {
    return matchMediaFn('(display-mode: fullscreen)').matches === true
  } catch {
    return false
  }
}

export function esIOS(nav: NavigatorLike): boolean {
  const ua = nav.userAgent ?? ''
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true
  }
  return nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1
}

function estadoDesdeEntorno(win: WindowLike): InstallStatus {
  const nav = win.navigator ?? {}
  if (esStandalone(win.matchMedia, nav)) {
    return 'installed'
  }
  if (esIOS(nav)) {
    return 'ios-instructions'
  }
  return 'unavailable'
}

export function useInstallPrompt(): {
  status: InstallStatus
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
} {
  const [status, setStatus] = useState<InstallStatus>(() => {
    if (typeof window === 'undefined') {
      return 'unavailable'
    }
    return estadoDesdeEntorno(window)
  })

  const eventoRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const nav = window.navigator ?? {}

    if (esStandalone(window.matchMedia, nav) || esIOS(nav)) {
      return
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      eventoRef.current = event as BeforeInstallPromptEvent
      setStatus('available')
    }
    const onAppInstalled = () => {
      eventoRef.current = null
      setStatus('installed')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'unavailable'
  > => {
    const evento = eventoRef.current
    if (!evento) {
      return 'unavailable'
    }
    eventoRef.current = null
    await evento.prompt()
    const { outcome } = await evento.userChoice
    if (outcome === 'accepted') {
      setStatus('installed')
    }
    return outcome
  }, [])

  return { status, promptInstall }
}
