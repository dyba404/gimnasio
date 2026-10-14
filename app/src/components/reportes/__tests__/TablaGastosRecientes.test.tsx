import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TablaGastosRecientes } from '../TablaGastosRecientes'
import { etiquetaCategoria } from '@/mocks/gastos'
import type { Gasto } from '@/mocks/gastos'

function render(gastos: readonly Gasto[]): string {
  return renderToStaticMarkup(<TablaGastosRecientes gastos={gastos} />).replace(
    /<!--[^>]*-->/g,
    '',
  )
}

const gastos: readonly Gasto[] = [
  {
    id: 'g-1',
    categoria: 'alquiler',
    descripcion: 'Alquiler del local',
    proveedor: 'Inmobiliaria Salazar',
    monto: 3500,
    fecha: '2026-09-01',
  },
  {
    id: 'g-2',
    categoria: 'servicios',
    descripcion: 'Recibo de luz del local',
    proveedor: 'Luz del Sur',
    monto: 450,
    fecha: '2026-09-02',
  },
  {
    id: 'g-3',
    categoria: 'sueldos',
    descripcion: 'Sueldo recepcionista',
    proveedor: 'María Flores Quispe',
    monto: 1200,
    fecha: '2026-09-05',
  },
]

describe('TablaGastosRecientes — últimos gastos del periodo', () => {
  const html = render(gastos)

  it('renderiza una fila por gasto más la cabecera', () => {
    expect((html.match(/<tr(?![a-zA-Z])/g) ?? []).length).toBe(gastos.length + 1)
  })

  it('muestra descripción, proveedor y monto con formato canónico', () => {
    expect(html).toContain('Alquiler del local')
    expect(html).toContain('Inmobiliaria Salazar')
    expect(html).toContain('S/ 3,500.00')
    expect(html).toContain('S/ 450.00')
    expect(html).toContain('S/ 1,200.00')
  })

  it('muestra el badge con la etiqueta en español de cada categoría', () => {
    for (const gasto of gastos) {
      expect(html).toContain(`>${etiquetaCategoria[gasto.categoria]}<`)
    }
    expect(html).not.toContain('Rent')
    expect(html).not.toContain('Salary')
  })

  it('nunca muestra fechas ISO crudas', () => {
    expect(html).not.toContain('2026-09-')
  })

  it('con lista vacía muestra estado vacío', () => {
    expect(render([])).toContain('Sin gastos registrados en este periodo')
  })
})
