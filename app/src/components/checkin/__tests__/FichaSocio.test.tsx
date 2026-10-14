import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { FichaSocio } from '../FichaSocio'
import type { Membresia, Plan, Socio } from '@/mocks/types'

vi.mock('@/lib/datos', () => ({
  cargarConfigGym: () => Promise.resolve(null),
}))

const socioVencido: Socio = {
  id: 'soc-04',
  codigo: 'MS-004',
  nombre: 'Kevin Rodrigo Muñoz',
  dni: '87654321',
  telefono: '999876543',
  planId: 'plan-mensual',
  estado: 'moroso',
  fechaRegistro: '2025-01-10',
}

const membresiaVencida: Membresia = {
  id: 'mem-test',
  socioId: 'soc-04',
  planId: 'plan-mensual',
  fechaInicio: '2026-07-15',
  fechaFin: '2026-08-15',
  monto: 80,
  estado: 'vencida',
}

const planMensual: Plan = {
  id: 'plan-mensual',
  nombre: 'Mensual',
  precio: 80,
  duracionDias: 30,
}

function renderFicha(
  props: Partial<Parameters<typeof FichaSocio>[0]> = {},
): string {
  return renderToStaticMarkup(
    <FichaSocio
      socio={socioVencido}
      estado="vencida"
      membresia={membresiaVencida}
      plan={planMensual}
      onCheckin={vi.fn()}
      onDenegar={vi.fn()}
      onCobrar={vi.fn()}
      onCancelar={vi.fn()}
      {...props}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('FichaSocio — mensaje de cobranza', () => {
  it('sin backend el mensaje de WhatsApp NO lleva el link demo DEMOMARS01', () => {
    const html = renderFicha()
    const mensaje =
      decodeURIComponent(html.split('?text=')[1]?.split('"')[0] ?? '')
    expect(mensaje).toContain('venció el 15/08/2026')
    expect(mensaje).not.toContain('https://express.culqi.com/DEMOMARS01')
    expect(mensaje).not.toContain('Renueva aquí')
  })

  it('la prop linkPago viaja al mensaje cuando el padre la pasa', () => {
    const html = renderFicha({ linkPago: 'https://express.culqi.com/REAL01' })
    const mensaje =
      decodeURIComponent(html.split('?text=')[1]?.split('"')[0] ?? '')
    expect(mensaje).toContain('https://express.culqi.com/REAL01')
    expect(mensaje).toContain('Renueva aquí (Yape, Plin o tarjeta)')
  })

  it('mantiene el bloque de membresía vencida con Cobrar ahora', () => {
    const html = renderFicha()
    expect(html).toContain('Membresía vencida')
    expect(html).toContain('Cobrar ahora')
  })
})
