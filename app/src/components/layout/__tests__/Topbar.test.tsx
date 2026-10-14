import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Topbar } from '../Topbar'
import { SearchProvider } from '@/components/command-menu'
import { SidebarProvider } from '@/components/ui/sidebar'

// Sin backend → modo demo (VITE_DEMO_MODE=1 activo en .env.test del vitest)
vi.mock('@/lib/supabase', () => ({
  clienteSupabase: () => null,
  supabaseDisponible: () => false,
}))

// ThemeToggle lee document en su inicial state; fuera del alcance de este test.
vi.mock('@/components/layout/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))

function renderTopbar(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <SidebarProvider>
        <SearchProvider>
          <Topbar />
        </SearchProvider>
      </SidebarProvider>
    </MemoryRouter>,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('Topbar — cuenta del usuario', () => {
  it('no muestra el usuario demo hardcodeado "Marsmode Gym / admin@marsmode.pe"', () => {
    const html = renderTopbar()
    expect(html).not.toContain('Marsmode Gym')
    expect(html).not.toContain('admin@marsmode.pe')
  })

  it('en modo demo el avatar muestra M (no MG hardcodeado) y el label demo no filtra datos del gym', () => {
    const html = renderTopbar()
    // radix no abre el menú en SSR; el label vive en DropdownMenuLabel.
    // El avatar demo cae a M, sin usuario real que cargar.
    expect(html).toContain('>M</span>')
    expect(html).not.toContain('>MG<')
    expect(html).not.toContain('Marsmode Gym')
    expect(html).not.toContain('admin@marsmode.pe')
  })

  it('el menú de cuenta ya no usa el aria-label del gimnasio', () => {
    const html = renderTopbar()
    expect(html).toContain('Menú de la cuenta')
    expect(html).not.toContain('Menú del gimnasio')
  })

  it('el botón de búsqueda sigue presente', () => {
    const html = renderTopbar()
    expect(html).toContain('Buscar (Ctrl K)')
  })
})
