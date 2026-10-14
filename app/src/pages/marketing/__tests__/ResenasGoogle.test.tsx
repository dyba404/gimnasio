import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MarketingPage from '../MarketingPage'
import { configGymMock } from '@/mocks/config'
import { sociosMock } from '@/mocks/data'
import { fechaHoyIso } from '@/mocks/pos'
import {
  puedePedirResena,
  solicitudesResenaMock,
  sociosElegiblesParaResena,
} from '@/mocks/resenas'

function render(): string {
  return renderToStaticMarkup(<MarketingPage />).replace(/<!--[^>]*-->/g, '')
}

function contar(aguja: string, html: string): number {
  return html.split(aguja).length - 1
}

describe('MarketingPage — sección Reseñas Google', () => {
  const html = render()

  it('sección con KPIs "Reseñas pedidas" (4) y "Socios elegibles hoy"', () => {
    expect(html).toContain('Reseñas Google')
    expect(html).toContain('Reseñas pedidas')
    expect(html).toContain(`>${solicitudesResenaMock.length}<`)
    const elegibles = sociosElegiblesParaResena(
      sociosMock,
      solicitudesResenaMock,
      fechaHoyIso(),
    )
    expect(html).toContain('Socios elegibles hoy')
    expect(html).toContain(`>${elegibles.length}<`)
  })

  it('lista una fila por solicitud con socio, fecha y gatillo Renovación', () => {
    expect(contar('Pedida el ', html)).toBe(solicitudesResenaMock.length)
    expect(contar('Renovación</span>', html)).toBe(solicitudesResenaMock.length)
    expect(html).toContain('Rosa Ñahui Quispe')
    expect(html).toContain('María Gracia Belaúnde')
  })

  it('badge "En espera" solo en la solicitud dentro de la ventana de 90 días', () => {
    const esperado = solicitudesResenaMock.filter(
      (solicitud) => !puedePedirResena(solicitud.fecha, fechaHoyIso()),
    ).length
    expect(esperado).toBe(1)
    expect(contar('En espera</span>', html)).toBe(esperado)
  })

  it('explica la regla de 90 días y el momento feliz', () => {
    expect(html).toContain('Máx. 1 por socio cada 90 días')
    expect(html).toContain('racha de 10 días de asistencia')
  })

  it('con link configurado muestra el link y no el aviso de configuración', () => {
    expect(configGymMock.linkResenaGoogle).toBeDefined()
    expect(html).toContain('g.page/r/DEMOMARS01/review')
    expect(html).not.toContain('Configura tu link de reseña en Configuración.')
  })
})
