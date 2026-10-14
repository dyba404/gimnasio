import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MembresiasPage from '../MembresiasPage'

function render(): string {
  return renderToStaticMarkup(<MembresiasPage />).replace(/<!--[^>]*-->/g, '')
}

describe('MembresiasPage — KPI de renovaciones reales', () => {
  const html = render()

  it('el KPI se llama "Renovadas este mes" (renovaciones ejecutadas, no vencimientos programados)', () => {
    expect(html).toContain('Renovadas este mes')
  })

  it('el KPI ya no usa la semántica invertida "Renovaciones este mes"', () => {
    expect(html).not.toContain('Renovaciones este mes')
  })

  it('arranca con el valor semilla de renovaciones históricas (3)', () => {
    expect(html).toMatch(/Renovadas este mes[\s\S]*?>3</)
  })
})

describe('MembresiasPage — estructura', () => {
  const html = render()

  it('mantiene los otros tres KPIs', () => {
    expect(html).toContain('MRR estimado')
    expect(html).toContain('Vencidas sin renovar')
    expect(html).toContain('Congeladas')
  })

  it('el KPI MRR explica su criterio (vigentes y congeladas, sin vencidas)', () => {
    expect(html).toContain('Vigentes y congeladas; excluye vencidas')
  })

  it('mantiene los filtros y la lista de membresías', () => {
    expect(html).toContain('Vigentes')
    expect(html).toContain('Por vencer')
    expect(html).toContain('Vencidas')
  })
})

describe('MembresiasPage — KPI de cuentas familiares', () => {
  const html = render()

  it('muestra el KPI "Cuentas familiares"', () => {
    expect(html).toContain('Cuentas familiares')
  })

  it('refleja la cantidad de cuentas del mock (3)', () => {
    expect(html).toMatch(/Cuentas familiares[\s\S]*?>3</)
  })

  it('explica la responsabilidad solidaria del head', () => {
    expect(html).toContain('Una factura por grupo; el head responde solidario')
  })
})
