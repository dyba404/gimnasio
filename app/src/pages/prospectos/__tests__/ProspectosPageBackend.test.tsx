import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ProspectosPage from '../ProspectosPage'

const modo = vi.hoisted(() => ({ backendActivo: true }))

vi.mock('@/lib/supabase', () => ({
  clienteSupabase: () => null,
  detectarSupabase: () => false,
  supabaseDisponible: () => modo.backendActivo,
  valorEnv: () => '',
}))

function render(): string {
  return renderToStaticMarkup(<ProspectosPage />).replace(/<!--[^>]*-->/g, '')
}

describe('ProspectosPage con backend activo — cero mocks visibles', () => {
  it('no muestra prospectos del mock', () => {
    modo.backendActivo = true
    const html = render()
    expect(html).not.toContain('Luis Ramírez')
    expect(html).not.toContain('Ana Quispe')
    expect(html).not.toContain('Carla Flores')
  })

  it('muestra el empty state con KPIs en cero', () => {
    modo.backendActivo = true
    const html = render()
    expect(html).toContain('Aún no hay prospectos')
    expect(html).toContain('S/ 0.00')
    expect(html).toContain('0%')
  })
})

describe('ProspectosPage sin backend ni modo demo — también vacío', () => {
  it('arranca vacío sin exponer los mocks', () => {
    modo.backendActivo = false
    const html = render()
    expect(html).toContain('Aún no hay prospectos')
    expect(html).not.toContain('Luis Ramírez')
  })
})
