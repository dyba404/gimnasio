import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProspectosPage from '../ProspectosPage'

function render(): string {
  return renderToStaticMarkup(<ProspectosPage />).replace(/<!--[^>]*-->/g, '')
}

describe('ProspectosPage — KPIs del pipeline', () => {
  const html = render()

  it('muestra los cuatro KPIs del CRM', () => {
    expect(html).toContain('Pipeline potencial')
    expect(html).toContain('Ganados este mes')
    expect(html).toContain('Tasa de conversión')
    expect(html).toContain('Por contactar')
  })

  it('el pipeline potencial se expresa en soles', () => {
    expect(html).toMatch(/Pipeline potencial[\s\S]*?S\/ /)
  })

  it('la tasa de conversión se muestra como porcentaje', () => {
    expect(html).toMatch(/Tasa de conversión[\s\S]*?[%]</)
  })
})

describe('ProspectosPage — tabla y alertas', () => {
  const html = render()

  it('renderiza el encabezado de la pantalla', () => {
    expect(html).toContain('Prospectos')
    expect(html).toContain('del primer contacto a la venta cerrada')
  })

  it('marca en ámbar los prospectos sin gestión 7+ días', () => {
    expect(html).toContain('Sin gestión 7+ días')
  })

  it('lista prospectos con acciones por fila', () => {
    expect(html).toContain('aria-label="Acciones para Ana Quispe"')
  })

  it('muestra la paginación del CRM', () => {
    expect(html).toContain('Página 1 de 2')
  })
})
