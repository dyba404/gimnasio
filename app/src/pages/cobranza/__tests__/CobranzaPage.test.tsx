import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CobranzaPage from '../CobranzaPage'

function render(): string {
  return renderToStaticMarkup(<CobranzaPage />).replace(/<!--[^>]*-->/g, '')
}

describe('CobranzaPage — encabezado y KPIs', () => {
  const html = render()

  it('renderiza el encabezado de la secuencia', () => {
    expect(html).toContain('Cobranza')
    expect(html).toContain('Secuencia de recuperación d0 → d12')
  })

  it('muestra los cuatro KPIs', () => {
    expect(html).toContain('En cobranza')
    expect(html).toContain('Deuda total')
    expect(html).toContain('Gestiones pendientes hoy')
    expect(html).toContain('Recuperado post-secuencia')
  })

  it('la deuda total se expresa en soles', () => {
    expect(html).toMatch(/Deuda total[\s\S]*?S\/ /)
  })
})

describe('CobranzaPage — tablero por etapas', () => {
  const html = render()

  it('muestra los títulos de las 6 columnas del kanban', () => {
    expect(html).toContain('Venció hoy')
    expect(html).toContain('Día 1')
    expect(html).toContain('Día 4')
    expect(html).toContain('Día 7')
    expect(html).toContain('Día 12')
    expect(html).toContain('Escalado')
  })

  it('muestra la sección de gestiones pendientes hoy', () => {
    expect(html).toContain('Gestión pendiente HOY')
  })

  it('lista los morosos con monto en badge rojo', () => {
    expect(html).toContain('Gabriela Sánchez León')
    expect(html).toContain('S/ 405.00')
  })

  it('renderiza la tarjeta explicativa de la secuencia', () => {
    expect(html).toContain('Cómo funciona la secuencia')
    expect(html).toContain('quincena')
  })
})
