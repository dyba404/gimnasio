import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { FormularioGasto } from '../FormularioGasto'

function render(): string {
  return renderToStaticMarkup(<FormularioGasto onRegistrar={vi.fn()} />).replace(
    /<!--[^>]*-->/g,
    '',
  )
}

describe('FormularioGasto — registrar gasto (estado local mock)', () => {
  const html = render()

  it('muestra título y los 4 campos', () => {
    expect(html).toContain('Registrar gasto')
    expect(html).toContain('Categoría')
    expect(html).toContain('Descripción')
    expect(html).toContain('Proveedor')
    expect(html).toContain('Monto (S/)')
  })

  it('usa el Select de shadcn con trigger asociado al label, no un select nativo', () => {
    expect(html).not.toContain('<option')
    expect(html).toContain('data-slot="select-trigger"')
    expect(html).toMatch(/<button[^>]*role="combobox"[^>]*id="gasto-categoria"/)
  })

  it('el botón de registro está deshabilitado con el formulario vacío', () => {
    expect(html).toMatch(/<button[^>]*disabled/)
  })
})
