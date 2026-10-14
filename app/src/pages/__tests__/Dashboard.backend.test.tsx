import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import Dashboard from '../Dashboard'

// Modo backend: Supabase disponible y loaders de red aislados. Con
// renderToStaticMarkup los efectos no corren, así que el render es el estado
// inicial pre-carga que un usuario real ve al abrir el Panel.
vi.mock('@/lib/supabase', () => ({
  supabaseDisponible: () => true,
  clienteSupabase: () => null,
}))

vi.mock('@/lib/datos', () => ({
  cargarSocios: vi.fn(() => Promise.resolve(null)),
  cargarMembresias: vi.fn(() => Promise.resolve(null)),
  cargarPlanes: vi.fn(() => Promise.resolve(null)),
  cargarPagos: vi.fn(() => Promise.resolve(null)),
  cargarAsistenciasRecientes: vi.fn(() => Promise.resolve(null)),
  contarAsistenciasHoy: vi.fn(() => Promise.resolve(null)),
  contarPagosDeHoy: vi.fn(() => Promise.resolve(null)),
  fechaIsoMenosDias: (dias: number) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - dias)
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${fecha.getFullYear()}-${mes}-${dia}`
  },
  renovarMembresia: vi.fn(() => Promise.resolve(true)),
}))

function renderBackend(): string {
  return renderToStaticMarkup(<Dashboard />).replace(/<!--[^>]*-->/g, '')
}

describe('Dashboard — modo backend: estado inicial pre-carga', () => {
  it('KPI "Cobrado hoy" en "—" sin cifras inventadas', () => {
    const html = renderBackend()
    expect(html).toContain('Cobrado hoy')
    expect(html).toContain('—')
  })

  it('cero fugas de los mocks demo (nombres o cifras) con backend activo', () => {
    const html = renderBackend()
    for (const nombre of ['Rosa Ñahui', 'Jorge Luis Ccahuana', 'Gabriela Sánchez']) {
      expect(html).not.toContain(nombre)
    }
    expect(html).not.toContain('S/ 135.00')
  })

  it('widgets con empty states honestos, no "Socio" fantasma', () => {
    const html = renderBackend()
    expect(html).toContain('Sin actividad reciente')
    expect(html).toContain('Revisando asistencias…')
    expect(html).toContain('Sin rachas registradas aún.')
  })

  it('no muestra tendencias inventadas ("+2 esta semana" ya no existe)', () => {
    const html = renderBackend()
    expect(html).not.toContain('esta semana')
    expect(html).not.toContain('desde ayer')
    expect(html).not.toMatch(/vs ayer/)
  })

  it('sin alert de error visible antes de cualquier acción', () => {
    const html = renderBackend()
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('No se pudo renovar')
  })
})

describe('Dashboard — renovación persistente (unidad de cálculo)', () => {
  it('renovarMembresia de la API real responde false sin cliente Supabase', async () => {
    // Importo la implementación REAL (sin mock) con vi.importActual:
    // la renovación del Dashboard usa exactamente esta función.
    const datos = await vi.importActual<typeof import('@/lib/datos')>('@/lib/datos')
    expect(typeof datos.renovarMembresia).toBe('function')
    const ok = await datos.renovarMembresia({
      membresiaId: 'mem-demo',
      fechaFin: '2026-10-13',
      estado: 'vigente',
    })
    // Sin .env de Supabase en el runner de tests: clienteSupabase() → null.
    expect(ok).toBe(false)
  })
})
