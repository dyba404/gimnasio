import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProspectoEstadoBadge } from '../ProspectoEstadoBadge'
import { ProspectosTable } from '../ProspectosTable'
import { prospectosMock } from '@/mocks/prospectos'
import { claseEstado, etiquetaEstado } from '@/mocks/prospectos'
import type { EstadoProspecto } from '@/mocks/prospectos'

function render(): string {
  return renderToStaticMarkup(
    <ProspectosTable
      prospectos={prospectosMock}
      busqueda=""
      onBusquedaChange={() => {}}
      filtroEstado={[]}
      onFiltroEstadoChange={() => {}}
      onRegistrarGestion={() => {}}
      onMarcarGanado={() => {}}
      onMarcarPerdido={() => {}}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('ProspectosTable — priorización de columnas en móvil (390px)', () => {
  const html = render()

  it('Fuente, Interés, Valor, Última gestión, Próxima acción y WhatsApp se ocultan en móvil', () => {
    const ocultas = html.match(/hidden md:table-cell/g)?.length ?? 0
    expect(ocultas).toBeGreaterThanOrEqual(12)
  })

  it('Prospecto, Estado y Acciones (⋮) permanecen visibles en móvil', () => {
    expect(html).toContain('Prospecto')
    expect(html).toContain('Estado')
    expect(html).toContain('Acciones')
  })

  it('cada fila visible tiene su menú de acciones con aria-label', () => {
    const visibles = Math.min(10, prospectosMock.length)
    const botones = html.match(/aria-label="Acciones para [^"]+"/g)?.length ?? 0
    expect(botones).toBe(visibles)
  })

  it('muestra el badge de alerta sin gestión 7+ días en ámbar', () => {
    expect(html).toContain('Sin gestión 7+ días')
    expect(html).toContain('bg-amber-500/15')
  })

  it('el teléfono inválido deja el botón WhatsApp deshabilitado', () => {
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('opacity-50')
  })

  it('el WhatsApp válido arma el enlace con mensaje de primer contacto', () => {
    expect(html).toContain('https://wa.me/51965874123?text=')
    expect(html).toContain('Hola%20Mar')
  })
})

describe('ProspectosTable — filtros por estado', () => {
  const html = render()

  it('el dropdown lista los seis estados con etiqueta', () => {
    for (const estado of Object.keys(etiquetaEstado) as EstadoProspecto[]) {
      expect(html).toContain(etiquetaEstado[estado])
    }
  })
})

describe('ProspectoEstadoBadge — color por estado', () => {
  for (const estado of Object.keys(claseEstado) as EstadoProspecto[]) {
    it(`renderiza ${etiquetaEstado[estado]} con su clase`, () => {
      const html = renderToStaticMarkup(<ProspectoEstadoBadge estado={estado} />)
      expect(html).toContain(etiquetaEstado[estado])
      expect(html).toContain(claseEstado[estado])
    })
  }
})
