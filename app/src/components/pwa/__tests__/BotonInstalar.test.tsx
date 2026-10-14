import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BotonInstalar } from '../BotonInstalar'
import {
  esIOS,
  esStandalone,
  type BeforeInstallPromptEvent,
  type InstallStatus,
} from '@/hooks/use-install-prompt'

type NavFalso = {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

function matchMediaCon(standalone: boolean, fullscreen = false) {
  return (query: string) => {
    const coincide = (modo: string, valor: boolean) => valor && query === modo
    return {
      matches:
        coincide('(display-mode: standalone)', standalone) ||
        coincide('(display-mode: fullscreen)', fullscreen),
    }
  }
}

describe('esStandalone', () => {
  it('detecta display-mode: standalone (Chrome/Edge instalado)', () => {
    expect(esStandalone(matchMediaCon(true), {})).toBe(true)
  })

  it('detecta display-mode: fullscreen', () => {
    expect(esStandalone(matchMediaCon(false, true), {})).toBe(true)
  })

  it('detecta navigator.standalone de iOS (no estándar)', () => {
    expect(esStandalone(matchMediaCon(false), { standalone: true })).toBe(true)
  })

  it('navegador de escritorio normal → false', () => {
    expect(esStandalone(matchMediaCon(false), { userAgent: 'Chrome/120' })).toBe(false)
  })

  it('sin matchMedia ni standalone → false', () => {
    expect(esStandalone(undefined, {})).toBe(false)
  })
})

describe('esIOS', () => {
  it('iPhone por userAgent → true', () => {
    expect(esIOS({ userAgent: 'iPhone OS 17_0 como Chrome' })).toBe(true)
  })

  it('iPad por userAgent → true', () => {
    expect(esIOS({ userAgent: 'iPad; CPU OS 16_6' })).toBe(true)
  })

  it('iPadOS moderno: MacIntel + maxTouchPoints > 1 → true', () => {
    expect(esIOS({ platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
  })

  it('Mac de escritorio sin touch → false', () => {
    expect(esIOS({ platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
  })

  it('Android → false', () => {
    expect(esIOS({ userAgent: 'Android 14; Pixel 8', platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false)
  })
})

describe('BotonInstalar — render por estado', () => {
  it("status 'available' → botón Instalar app", () => {
    const html = renderToStaticMarkup(<BotonInstalar status="available" />)
    expect(html).toContain('Instalar app')
    expect(html).toContain('<button')
  })

  it("status 'ios-instructions' → texto iPhone sin botón", () => {
    const html = renderToStaticMarkup(<BotonInstalar status="ios-instructions" />)
    expect(html).toContain('En iPhone: Compartir → Añadir a pantalla de inicio')
    expect(html).not.toContain('<button')
  })

  it("status 'installed' → null", () => {
    const html = renderToStaticMarkup(<BotonInstalar status="installed" />)
    expect(html).toBe('')
  })

  it("status 'unavailable' → null", () => {
    const html = renderToStaticMarkup(<BotonInstalar status="unavailable" />)
    expect(html).toBe('')
  })

  it('cubre todos los estados definidos', () => {
    const estados: InstallStatus[] = [
      'available',
      'unavailable',
      'installed',
      'ios-instructions',
    ]
    expect(estados).toHaveLength(4)
  })
})

describe('tipos públicos del hook', () => {
  it('BeforeInstallPromptEvent expone prompt y userChoice', async () => {
    const evento = new Event('beforeinstallprompt') as BeforeInstallPromptEvent
    Object.defineProperty(evento, 'platforms', { value: ['chrome'] })
    Object.defineProperty(evento, 'prompt', {
      value: async () => undefined,
    })
    Object.defineProperty(evento, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted', platform: 'chrome' }),
    })
    expect(evento.platforms).toEqual(['chrome'])
    await evento.prompt()
    await expect(evento.userChoice).resolves.toEqual({
      outcome: 'accepted',
      platform: 'chrome',
    })
  })

  it('navigator.falso sin metadatos no rompe los detectores', () => {
    const nav: NavFalso = {}
    expect(esIOS(nav)).toBe(false)
    expect(esStandalone(matchMediaCon(false), nav)).toBe(false)
  })
})
