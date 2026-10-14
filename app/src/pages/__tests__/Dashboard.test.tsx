import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Dashboard from '../Dashboard'
import { membrosiasVencidasEsperadas, sociosActivosEsperados } from './dashboard-esperanzas'

function render(): string {
  const html = renderToStaticMarkup(<Dashboard />)
  return html.replace(/<!--[^>]*-->/g, '')
}

describe('Dashboard — KPIs derivados de los mocks', () => {
  const html = render()

  it('KPI "Socios activos" refleja el conteo real de sociosMock (no un número fijo)', () => {
    expect(html).toContain(`>${sociosActivosEsperados}<`)
  })

  it('KPI "Membresías vencidas" refleja el conteo real de membresiasMock', () => {
    expect(html).toContain(`>${membrosiasVencidasEsperadas}<`)
  })

  it('"Cobrado hoy" (mock permitido) usa el formato canónico S/ con 2 decimales', () => {
    expect(html).toContain('Cobrado hoy')
    expect(html).toMatch(/S\/ \d[\d,]*\.\d{2}/)
  })
})

describe('Dashboard — estructura del panel', () => {
  const html = render()

  it('reutiliza VencimientosProximos una sola vez (sin duplicar el widget)', () => {
    const apariciones = (html.match(/Vencimientos próximos/g) ?? []).length
    expect(apariciones).toBe(1)
  })

  it('muestra el widget de Morosidad con dinero por cobrar', () => {
    expect(html).toContain('Morosidad')
    expect(html).toContain('socios con deuda')
    expect(html).toContain('Cobrar')
  })

  it('Actividad reciente muestra el feed derivado de pagos y asistencias reales', () => {
    expect(html).toContain('Actividad reciente')
    // El feed mezcla check-ins de hoy y pagos con su fecha real:
    // nada de "hace N min" inventado.
    expect(html).toContain('ingresó')
    expect(html).not.toMatch(/hace \d+ min/)
  })

  it('sin texto inglés de producto a la vista', () => {
    // "Student" es nombre de plan en los mocks; el resto de la UI debe estar en español
    expect(html).not.toMatch(/\b(Loading|Submit|Cancel|No data|Error)\b/)
  })

  it('no filtra identificadores internos de estado en la UI (bug: "por-vencer" a la vista)', () => {
    // Regresión: VencimientosProximos renderizaba {membresia.estado} crudo.
    // Los badges usan etiquetas limpias ("Por vencer"), el guion solo existe en el enum.
    expect(html).not.toContain('por-vencer')
  })
})
