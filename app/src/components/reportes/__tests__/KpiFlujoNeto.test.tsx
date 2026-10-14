import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KpiFlujoNeto } from '../KpiFlujoNeto'

function render(ingresos: number, gastos: number): string {
  return renderToStaticMarkup(<KpiFlujoNeto ingresos={ingresos} gastos={gastos} />).replace(
    /<!--[^>]*-->/g,
    '',
  )
}

describe('KpiFlujoNeto — strip de utilidad real', () => {
  it('muestra los tres KPIs con formato soles canónico', () => {
    const html = render(1000, 400)
    expect(html).toContain('Ingresos del periodo')
    expect(html).toContain('Gastos del periodo')
    expect(html).toContain('Utilidad neta')
    expect(html).toContain('S/ 1,000.00')
    expect(html).toContain('S/ 400.00')
    expect(html).toContain('S/ 600.00')
  })

  it('utilidad positiva usa verde y muestra el margen', () => {
    const html = render(1000, 400)
    expect(html).toMatch(/text-emerald-600/)
    expect(html).toContain('Margen de 60% sobre ingresos')
    expect(html).not.toMatch(/text-red-600/)
  })

  it('utilidad negativa usa rojo y margen negativo', () => {
    const html = render(400, 1000)
    expect(html).toMatch(/text-red-600/)
    expect(html).toContain('-S/ 600.00')
    expect(html).toContain('Margen de -150% sobre ingresos')
  })

  it('sin ingresos muestra mensaje en lugar de margen', () => {
    const html = render(0, 200)
    expect(html).toContain('Sin ingresos en este periodo')
    expect(html).toContain('-S/ 200.00')
  })
})
