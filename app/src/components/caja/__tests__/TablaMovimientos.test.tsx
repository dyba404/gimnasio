import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TablaMovimientos } from '../TablaMovimientos'
import type { MovimientoCaja } from '@/mocks/caja-data'

function render(movimientos: readonly MovimientoCaja[]): string {
  return renderToStaticMarkup(
    <TablaMovimientos movimientos={movimientos} />,
  ).replace(/<!--[^>]*-->/g, '')
}

const movimientos: readonly MovimientoCaja[] = [
  {
    id: 'm-1',
    hora: '08:32',
    socioNombre: 'Rosa Ñahui Quispe',
    concepto: 'membresia',
    metodo: 'efectivo',
    monto: 55,
  },
  {
    id: 'm-2',
    hora: '09:05',
    socioNombre: 'Jorge Luis Ccahuana Ríos',
    concepto: 'producto',
    metodo: 'yape',
    monto: 12.5,
  },
]

describe('TablaMovimientos — subtotales por método (tfoot legible)', () => {
  const html = render(movimientos)

  it('muestra un label "Subtotales por método" en la primera columna', () => {
    expect(html).toContain('Subtotales por método')
  })

  it('solo lista los métodos con movimientos (sin Plin ni S/ 0.00)', () => {
    expect(html).toContain('Efectivo')
    expect(html).toContain('Yape')
    expect(html).not.toContain('S/ 0.00')
    expect(html.match(/Plin/g)).toBeNull()
  })

  it('muestra los montos por método y el total del día', () => {
    expect(html).toContain('S/ 55.00')
    expect(html).toContain('S/ 12.50')
    expect(html).toContain('S/ 67.50')
  })

  it('separa visualmente el tbody con borde superior grueso y fondo muted', () => {
    expect(html).toContain('border-t-2')
    expect(html).toContain('bg-muted/50')
  })
})

describe('TablaMovimientos — responsive móvil', () => {
  const html = render(movimientos)

  it('oculta la columna Método en móvil y la muestra desde md', () => {
    expect(html).toMatch(/hidden h-10[^"]*md:table-cell/)
    expect(html.match(/hidden px-1 py-3 md:table-cell/g)?.length).toBe(
      movimientos.length,
    )
  })

  it('sin movimientos muestra el estado vacío', () => {
    expect(render([])).toContain('Sin movimientos registrados todavía')
  })
})
