import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MarketingPage from '../MarketingPage'

const modo = vi.hoisted(() => ({ backendActivo: true }))

vi.mock('@/lib/supabase', () => ({
  clienteSupabase: () => null,
  detectarSupabase: () => false,
  supabaseDisponible: () => modo.backendActivo,
  valorEnv: () => '',
}))

function render(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <MarketingPage />
    </MemoryRouter>,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('MarketingPage con backend activo — cero mocks visibles', () => {
  it('no muestra datos demo de referidos ni el link DEMOMARS01', () => {
    modo.backendActivo = true
    const html = render()
    expect(html).not.toContain('Rosa Ñahui Quispe')
    expect(html).not.toContain('Ana Sofía Rojas Paredes')
    expect(html).not.toContain('DEMOMARS01')
  })

  it('muestra los vacíos del programa: sin referidos ni referidores', () => {
    modo.backendActivo = true
    const html = render()
    expect(html).toContain('Aún no hay referidos registrados.')
    expect(html).toContain('Sin referidores aún.')
  })

  it('sin link de reseña configurado muestra el aviso con enlace a /config', () => {
    modo.backendActivo = true
    const html = render()
    expect(html).toContain('Sin link configurado')
    expect(html).toContain('href="/config"')
  })
})

describe('MarketingPage sin backend ni modo demo — empty general', () => {
  it('muestra el empty general y ningún dato del mock', () => {
    modo.backendActivo = false
    const html = render()
    expect(html).toContain('No hay datos del gimnasio')
    expect(html).not.toContain('Rosa Ñahui Quispe')
    expect(html).not.toContain('Recompensa: S/ 20')
  })
})
