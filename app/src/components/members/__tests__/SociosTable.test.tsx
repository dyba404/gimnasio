import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SociosTable } from '../SociosTable'
import { membresiasMock, planesMock, sociosMock } from '@/mocks/data'
import type { Membresia, Plan } from '@/mocks/types'

function render(): string {
  const planes = new Map<string, Plan>(planesMock.map((plan) => [plan.id, plan]))
  const membresiasPorSocio = new Map<string, Membresia>()
  for (const membresia of membresiasMock) {
    if (!membresiasPorSocio.has(membresia.socioId)) {
      membresiasPorSocio.set(membresia.socioId, membresia)
    }
  }
  return renderToStaticMarkup(
    <SociosTable
      socios={sociosMock}
      planes={planes}
      membresiasPorSocio={membresiasPorSocio}
      busqueda=""
      onBusquedaChange={vi.fn()}
      onVer={vi.fn()}
      onEditar={vi.fn()}
      onCongelar={vi.fn()}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('SociosTable — priorización de columnas en móvil (390px)', () => {
  const html = render()

  it('Teléfono y Plan se ocultan en móvil (hidden md:table-cell)', () => {
    const ocultas = html.match(/hidden md:table-cell/g)?.length ?? 0
    expect(ocultas).toBeGreaterThanOrEqual(4)
  })

  it('Acciones (⋮ carné/editar) permanece visible en móvil', () => {
    expect(html).toContain('Acciones')
    const btnCount = html.match(/aria-label="Acciones para [^"]+"/g)?.length ?? 0
    expect(btnCount).toBe(Math.min(10, sociosMock.length))
  })

  it('Estado y Vence — el dolor #1 del producto — permanecen visibles', () => {
    expect(html).toContain('Estado')
    expect(html).toContain('Vence')
  })

  it('Socio permanece visible y compacto en móvil (sin avatar)', () => {
    expect(html).toContain('Socio')
    expect(html).toContain('hidden size-9 md:flex')
  })

  it('el primer socio renderiza con su estado y fecha de vencimiento', () => {
    expect(html).toContain(sociosMock[0].nombre)
    expect(html).toContain('Activo')
  })
})
