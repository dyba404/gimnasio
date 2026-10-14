import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../LoginPage'

vi.mock('@/lib/supabase', () => ({
  clienteSupabase: () => null,
  supabaseDisponible: () => false,
}))

function render(props: Parameters<typeof LoginPage>[0] = {}): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <LoginPage {...props} />
    </MemoryRouter>,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('LoginPage', () => {
  it('renderiza el logo M y la marca Marsmode', () => {
    const html = render()
    expect(html).toContain('Marsmode')
    expect(html).toContain('>M</div>')
  })

  it('tiene inputs de correo y contraseña con labels', () => {
    const html = render()
    expect(html).toContain('id="email"')
    expect(html).toContain('type="email"')
    expect(html).toContain('id="password"')
    expect(html).toContain('type="password"')
    expect(html).toContain('Correo')
    expect(html).toContain('Contraseña')
  })

  it('tiene el botón Ingresar', () => {
    const html = render()
    expect(html).toContain('Ingresar')
    expect(html).toContain('<button')
  })

  it('el link Solicitar acceso apunta a wa.me', () => {
    const html = render()
    expect(html).toContain('Solicitar acceso')
    expect(html).toContain('https://wa.me/51999999999')
  })

  it('acepta onLogin opcional sin romper el render', () => {
    const html = render({ onLogin: vi.fn() })
    expect(html).toContain('Marsmode')
  })

  it('no tiene botón deshabilitado en estado inicial', () => {
    const html = render()
    expect(html).not.toContain('disabled=""')
  })

  it('no muestra el error de app sin configurar en el render inicial', () => {
    const html = render()
    expect(html).not.toContain('App sin configurar')
  })
})

describe('produccionSinBackend', () => {
  it('en modo test (no producción) con demo activo NO bloquea: flujo demo sigue abierto', async () => {
    vi.resetModules()
    const { produccionSinBackend } = await import('../config')
    // MODE de vitest es 'test', nunca 'production'
    expect(import.meta.env.MODE).not.toBe('production')
    expect(produccionSinBackend()).toBe(false)
  })

  it('en producción sin backend BLOQUEA el login', async () => {
    vi.stubEnv('MODE', 'production')
    vi.resetModules()
    const { produccionSinBackend } = await import('../config')
    expect(produccionSinBackend()).toBe(true)
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('el texto de bloqueo es exacto para producción sin credenciales', async () => {
    vi.resetModules()
    const { TEXTO_APP_SIN_CONFIGURAR } = await import('../config')
    expect(TEXTO_APP_SIN_CONFIGURAR).toBe(
      'App sin configurar: faltan las credenciales del servidor (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
    )
  })
})
