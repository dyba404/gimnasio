import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ActividadReciente } from '../ActividadReciente'
import { asistenciasMock } from '@/mocks/asistencias'
import { fechaHoyIso } from '@/mocks/bitacora'
import { formatoSoles } from '@/lib/format'
import { sociosMock } from '@/mocks/data'
import type { Socio } from '@/mocks/types'
import type { Pago } from '@/mocks/pagos'
import type { Asistencia } from '@/mocks/asistencias'

const hoyIso = fechaHoyIso()

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

const sociosFixture: readonly Socio[] = [
  {
    id: 'soc-a',
    codigo: 'MS-001',
    nombre: 'Rosa Ñahui Quispe',
    dni: '45782136',
    telefono: '987 214 503',
    planId: 'plan-mensual',
    estado: 'activo',
    fechaRegistro: '2026-01-01',
  },
  {
    id: 'soc-b',
    codigo: 'MS-002',
    nombre: 'Jorge Luis Ccahuana Ríos',
    dni: '40112958',
    telefono: '954 780 126',
    planId: 'plan-trimestral',
    estado: 'activo',
    fechaRegistro: '2026-02-02',
  },
]

const pagosFixture: readonly Pago[] = [
  {
    id: 'pago-1',
    fecha: hoyIso,
    socioId: 'soc-a',
    nombre: 'Rosa Ñahui Quispe',
    codigo: 'MS-001',
    dni: '45782136',
    planId: 'plan-mensual',
    planNombre: 'Mensual',
    monto: 80,
    metodo: 'yape',
    estado: 'completado',
    concepto: 'membresia',
  },
  {
    id: 'pago-2',
    fecha: hoyIso,
    socioId: 'soc-b',
    nombre: 'Jorge Luis Ccahuana Ríos',
    codigo: 'MS-002',
    dni: '40112958',
    planId: 'plan-student',
    planNombre: 'Estudiante',
    monto: 55,
    metodo: 'efectivo',
    estado: 'completado',
    concepto: 'membresia',
  },
  {
    id: 'pago-3',
    fecha: hoyIso,
    socioId: 'soc-a',
    nombre: 'Rosa Ñahui Quispe',
    codigo: 'MS-001',
    dni: '45782136',
    planId: 'plan-mensual',
    planNombre: 'Mensual',
    monto: 80,
    metodo: 'plin',
    estado: 'pendiente',
    concepto: 'membresia',
  },
]

const asistenciasFixture: readonly Asistencia[] = [
  { socioId: 'soc-a', fecha: hoyIso, hora: '15:12' },
  { socioId: 'soc-b', fecha: '2026-01-01', hora: '08:30' },
]

const sociosMapFixture = new Map(sociosFixture.map((socio) => [socio.id, socio]))

function render(props: {
  pagos?: readonly Pago[]
  asistenciasRecientes?: readonly Asistencia[]
}): string {
  return renderToStaticMarkup(
    <ActividadReciente
      pagos={props.pagos ?? pagosFixture}
      asistenciasRecientes={props.asistenciasRecientes ?? asistenciasFixture}
      sociosMap={sociosMapFixture}
      hoyIso={hoyIso}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('ActividadReciente — feed derivado de pagos y asistencias reales', () => {
  it('sin props: empty state "Sin actividad reciente" y ninguna fila', () => {
    const html = renderToStaticMarkup(<ActividadReciente />).replace(
      /<!--[^>]*-->/g,
      '',
    )
    expect(html).toContain('Sin actividad reciente')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(0)
  })

  it('con pagos y asistencias arma el feed mezclado (4 filas)', () => {
    const html = render({})
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(4)
  })

  it('solo muestra pagos completados: el pendiente queda fuera', () => {
    const html = render({})
    expect(html).toContain('Rosa Ñahui Quispe pagó Mensual')
    expect(html).toContain('Jorge Luis Ccahuana Ríos pagó Estudiante')
    expect(html).not.toContain('Plin ·')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(4)
  })

  it('check-ins con nombre del socio y su hora real de hoy', () => {
    const html = render({})
    expect(html).toContain('Rosa Ñahui Quispe ingresó')
    expect(html).toContain('hoy 15:12')
  })

  it('asistencias de otro día muestran fecha corta, no "hoy"', () => {
    const html = render({})
    expect(html).toContain('Jorge Luis Ccahuana Ríos ingresó')
    expect(html).toContain('1/1/2026')
  })

  it('método con mayúscula inicial y monto con formato canónico', () => {
    const html = render({})
    expect(html).toContain(`Yape · ${formatoSoles(80)}`)
    expect(html).toContain(`Efectivo · ${formatoSoles(55)}`)
  })

  it('el feed se limita a 6 actividades (las más recientes primero)', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    const pagos = Array.from({ length: 8 }, (_, i): Pago => ({
      id: `pago-mas-${i}`,
      fecha: aIso(ayer),
      socioId: 'soc-a',
      nombre: 'Rosa Ñahui Quispe',
      codigo: 'MS-001',
     dni: '45782136',
      planId: 'plan-mensual',
      planNombre: 'Mensual',
      monto: 80,
      metodo: 'yape',
      estado: 'completado',
      concepto: 'membresia',
    }))
    const html = render({ pagos, asistenciasRecientes: [] })
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(6)
  })

  it('asistencias sin socio en el mapa no generan filas basura', () => {
    const html = render({ asistenciasRecientes: [{ socioId: 'fantasma', fecha: hoyIso }] })
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(2)
    expect(html).not.toContain('fantasma')
  })

  it('integra con ids de sociosMock cuando el padre pasa ese mapa (modo demo)', () => {
    const sociosMapDemo = new Map(sociosMock.map((socio) => [socio.id, socio]))
    const html = renderToStaticMarkup(
      <ActividadReciente
        pagos={[]}
        asistenciasRecientes={asistenciasMock.slice(-6)}
        sociosMap={sociosMapDemo}
        hoyIso={hoyIso}
      />,
    ).replace(/<!--[^>]*-->/g, '')
    const checkins = [...html.matchAll(/ingresó/g)].length
    expect(checkins).toBeGreaterThan(0)
    expect(html).not.toContain('Sin actividad reciente')
  })
})
