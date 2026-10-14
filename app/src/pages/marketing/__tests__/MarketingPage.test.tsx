import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MarketingPage from '../MarketingPage'
import { membresiasMock, sociosMock } from '@/mocks/data'
import { pagosMock } from '@/mocks/pagos'
import {
  agruparPagosPorSocio,
  descuentosEntregados,
  estadoDerivado,
  motivoNoCalifica,
  referidosMock,
} from '@/mocks/referidos'
import type { ContextoReferidos, EstadoReferido } from '@/mocks/referidos'
import type { Membresia, Socio } from '@/mocks/types'

const contexto: ContextoReferidos = {
  socios: new Map(sociosMock.map((socio): [string, Socio] => [socio.id, socio])),
  membresias: new Map(
    membresiasMock.map((membresia): [string, Membresia] => [membresia.socioId, membresia]),
  ),
  pagosPorSocio: agruparPagosPorSocio(pagosMock),
}

const estados: readonly EstadoReferido[] = referidosMock.map((referido) =>
  estadoDerivado(referido, contexto),
)

function render(): string {
  return renderToStaticMarkup(<MarketingPage />).replace(/<!--[^>]*-->/g, '')
}

function contar(aguja: string, html: string): number {
  return html.split(aguja).length - 1
}

describe('MarketingPage — encabezado y KPIs', () => {
  const html = render()

  it('título "Marketing" con subtítulo "Programa de referidos"', () => {
    expect(html).toContain('Marketing')
    expect(html).toContain('Programa de referidos')
  })

  it('KPI "Referidos activos" = referidos cuyo estado no es inválido', () => {
    const esperado = estados.filter((estado) => estado !== 'invalido').length
    expect(html).toContain('Referidos activos')
    expect(html).toContain(`>${esperado}<`)
  })

  it('KPI "Recompensas listas" = referidos elegibles', () => {
    const esperado = estados.filter((estado) => estado === 'elegible').length
    expect(html).toContain('Recompensas listas')
    expect(html).toContain(`>${esperado}<`)
  })

  it('KPI "Descuentos entregados" = aplicados × S/ 20 con formato canónico', () => {
    const esperado = descuentosEntregados(estados)
    expect(html).toContain('Descuentos entregados')
    expect(html).toContain(`>S/ ${esperado}.00<`)
  })
})

describe('MarketingPage — lista de referidos con estados', () => {
  const html = render()

  it('muestra una fila por cada referido del mock (8)', () => {
    expect(contar('Desde ', html)).toBe(referidosMock.length)
  })

  it('muestra referidor → referido con flecha para cada fila', () => {
    expect(contar('lucide-arrow-right', html)).toBe(referidosMock.length)
    expect(html).toContain('Rosa Ñahui Quispe')
    expect(html).toContain('Jorge Luis Ccahuana Ríos')
  })

  it('badge emerald "Recompensa lista" solo en los elegibles', () => {
    const esperado = estados.filter((estado) => estado === 'elegible').length
    expect(esperado).toBeGreaterThan(0)
    expect(contar('Recompensa lista</span>', html)).toBe(esperado)
  })

  it('botón "Aplicar S/ 20 descuento" solo en los elegibles', () => {
    const esperado = estados.filter((estado) => estado === 'elegible').length
    expect(contar('Aplicar S/ 20 descuento', html)).toBe(esperado)
  })

  it('badge "Pendiente" ámbar en los pendientes, con motivo visible', () => {
    const esperado = estados.filter((estado) => estado === 'pendiente').length
    expect(esperado).toBeGreaterThan(0)
    expect(contar('Pendiente</span>', html)).toBe(esperado)
    const motivosPendientes = referidosMock
      .filter((referido) => estadoDerivado(referido, contexto) === 'pendiente')
      .map((referido) => motivoNoCalifica(referido, contexto))
    for (const motivo of motivosPendientes) {
      expect(html).toContain(motivo)
    }
  })

  it('badge gris "Descuento aplicado" con check en los aplicados', () => {
    const esperado = estados.filter((estado) => estado === 'aplicado').length
    expect(esperado).toBeGreaterThan(0)
    expect(contar('Descuento aplicado</span>', html)).toBe(esperado)
  })

  it('badge "Inválido" muted con motivo "Referido inactivo"', () => {
    const esperado = estados.filter((estado) => estado === 'invalido').length
    expect(esperado).toBeGreaterThan(0)
    expect(contar('Inválido</span>', html)).toBe(esperado)
    expect(html).toContain('Referido inactivo')
  })

  it('cada fila muestra la fecha de registro del referido', () => {
    expect(html).toContain('Desde ')
  })
})

describe('MarketingPage — top referidores y regla', () => {
  const html = render()

  it('muestra Top referidores con el líder (2 referidos)', () => {
    expect(html).toContain('Top referidores')
    expect(html).toContain('Ana Sofía Rojas Paredes')
    expect(html).toContain('2 referidos')
  })

  it('top 3: tres badges de conteo (líder 2, resto 1)', () => {
    expect(contar('referidos</span>', html)).toBe(1)
    expect(contar('referido</span>', html)).toBe(2)
  })

  it('sección explicativa con la regla de recompensa y anti-abuso', () => {
    expect(html).toContain('Recompensa: S/ 20 de descuento en el próximo pago del referidor')
    expect(html).toContain('Regla anti-abuso')
    expect(html).toContain('activo y al día')
  })

  it('sin texto inglés de producto a la vista', () => {
    expect(html).not.toMatch(/\b(Loading|Submit|Cancel|No data|Error)\b/)
  })
})
