import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LogrosSocio } from '../LogrosSocio'
import type { Asistencia } from '@/mocks/asistencias'

const HOY_ISO = '2026-09-10'

function diasAtras(dias: number): string {
  const base = new Date(2026, 8, 10)
  base.setDate(base.getDate() - dias)
  const anio = base.getFullYear()
  const mes = String(base.getMonth() + 1).padStart(2, '0')
  const dia = String(base.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function as(offset: number, hora?: string): Asistencia {
  return { socioId: 's1', fecha: diasAtras(offset), ...(hora ? { hora } : {}) }
}

function render(asistencias: readonly Asistencia[]): string {
  return renderToStaticMarkup(
    <LogrosSocio socioId="s1" asistencias={asistencias} hoyIso={HOY_ISO} />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('LogrosSocio — chips por umbral', () => {
  it('racha de 7 días (terminando ayer) concede el chip 🔥 Racha 7', () => {
    const asistencias = Array.from({ length: 7 }, (_, i) => as(i + 1))
    const html = render(asistencias)
    expect(html).toContain('Racha 7')
    expect(html).toContain('🔥')
    expect(html).toContain('7 días')
    expect(html).toContain('text-red-500')
  })

  it('racha de 6 días no llega al umbral: sin chip, racha ámbar', () => {
    const asistencias = Array.from({ length: 6 }, (_, i) => as(i + 1))
    const html = render(asistencias)
    expect(html).not.toContain('Racha 7')
    expect(html).toContain('6 días')
    expect(html).toContain('text-amber-500')
  })

  it('racha de 8 días pinta rojo (7+)', () => {
    const asistencias = Array.from({ length: 8 }, (_, i) => as(i))
    const html = render(asistencias)
    expect(html).toContain('text-red-500')
    expect(html).toContain('8 días')
  })

  it('racha corta (2 días) pinta gris y muestra mejor racha', () => {
    const asistencias = [as(0), as(1), as(10), as(11)]
    const html = render(asistencias)
    expect(html).toContain('2 días')
    expect(html).toContain('text-muted-foreground')
    expect(html).toContain('Mejor racha: 2')
  })

  it('sin asistencias: racha 0, sin chips y empty state', () => {
    const html = render([])
    expect(html).toContain('0 días')
    expect(html).toContain('Aún sin logros — cada visita suma')
    expect(html).not.toContain('Racha 7')
  })

  it('solo concede los logros cuyos umbrales se cumplen, no el catálogo completo', () => {
    const asistencias = Array.from({ length: 7 }, (_, i) => as(i + 1))
    const html = render(asistencias)
    expect(html).toContain('Racha 7')
    expect(html).not.toContain('Veterano')
    expect(html).not.toContain('Madrugador')
    expect(html).not.toContain('Constante')
  })
})
