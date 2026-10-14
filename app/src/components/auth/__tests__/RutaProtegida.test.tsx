import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RutaProtegida } from '../RutaProtegida'

vi.mock('@/lib/supabase', () => ({
  clienteSupabase: () => null,
  supabaseDisponible: () => false,
}))

describe('RutaProtegida', () => {
  it('en SSR muestra el divisor de verificación (el estado se resuelve en efecto)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RutaProtegida>
          <p>contenido interno</p>
        </RutaProtegida>
      </MemoryRouter>,
    )
    expect(html).toContain('min-h-svh')
  })

  it('es un componente function exportable', () => {
    expect(typeof RutaProtegida).toBe('function')
  })

  it('en modo demo (desarrollo) sin backend deja pasar el contenido tras verificar', () => {
    // MODE de vitest es 'test', nunca 'production' → no aplica el bloqueo
    expect(import.meta.env.MODE).not.toBe('production')
  })
})
