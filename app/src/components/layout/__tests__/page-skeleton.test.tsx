import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PageSkeleton } from '../page-skeleton'

function render(): string {
  return renderToStaticMarkup(<PageSkeleton />)
}

describe('PageSkeleton — fallback del Suspense en App', () => {
  it('renderiza 5 skeletons: 4 KPI cards + 1 rectángulo de tabla', () => {
    const html = render()
    expect((html.match(/data-slot="skeleton"/g) ?? []).length).toBe(5)
  })

  it('los 4 KPI cards usan la altura del KPI real (h-28)', () => {
    const html = render()
    expect((html.match(/h-28/g) ?? []).length).toBe(4)
  })

  it('el rectángulo de tabla usa h-96 y ocupa todo el ancho', () => {
    const html = render()
    expect(html).toContain('h-96')
    expect(html).toContain('w-full')
  })

  it('usa el ritmo visual del Panel (grid de KPIs + bloque principal)', () => {
    const html = render()
    expect(html).toContain('grid-cols-2')
    expect(html).toContain('xl:grid-cols-4')
  })
})
