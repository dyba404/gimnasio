import { fechaHoyIso } from '@/mocks/bitacora'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SociosEnRiesgo } from '../SociosEnRiesgo'
import type { Asistencia } from '@/mocks/asistencias'
import type { Membresia, Socio } from '@/mocks/types'

// HOY dinamico, la misma fecha de referencia que usan los mocks:
// fijado en '2026-09-13' la suite fallaba para cualquier fecha posterior.
const HOY_ISO = fechaHoyIso()

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function haceDiasIso(dias: number): string {
  const fecha = new Date(HOY_ISO + 'T00:00:00')
  fecha.setDate(fecha.getDate() - dias)
  return aIso(fecha)
}

const socios: readonly Socio[] = [
  {
    id: 'soc-1',
    codigo: 'MS-001',
    nombre: 'Rosa Ñahui Quispe',
    dni: '11111111',
    telefono: '999 999 999',
    planId: 'plan-mensual',
    estado: 'activo',
    fechaRegistro: haceDiasIso(90),
  },
  {
    id: 'soc-2',
    codigo: 'MS-002',
    nombre: 'Jorge Luis Ccahuana Ríos',
    dni: '22222222',
    telefono: '999 999 999',
    planId: 'plan-trimestral',
    estado: 'activo',
    fechaRegistro: haceDiasIso(200),
  },
  {
    id: 'soc-3',
    codigo: 'MS-003',
    nombre: 'María Gracia Belaúnde',
    dni: '33333333',
    telefono: '999 999 999',
    planId: 'plan-anual',
    estado: 'activo',
    fechaRegistro: haceDiasIso(30),
  },
]

const asistencias: readonly Asistencia[] = [
  // Rosa: vino ayer → no está en riesgo.
  { socioId: 'soc-1', fecha: haceDiasIso(1) },
  // Jorge: 12 días sin venir → En riesgo.
  { socioId: 'soc-2', fecha: haceDiasIso(12) },
  // María: 25 días sin venir → Crítico y primera en la lista.
  { socioId: 'soc-3', fecha: haceDiasIso(25) },
]

const membresias: readonly Membresia[] = [
  {
    id: 'mem-1',
    socioId: 'soc-2',
    planId: 'plan-trimestral',
    fechaInicio: haceDiasIso(45),
    fechaFin: haceDiasIso(-5),
    monto: 210,
    estado: 'vigente',
  },
  {
    id: 'mem-3',
    socioId: 'soc-3',
    planId: 'plan-anual',
    fechaInicio: haceDiasIso(80),
    fechaFin: haceDiasIso(-60),
    monto: 660,
    estado: 'vigente',
  },
]

function render(props: {
  socios?: readonly Socio[]
  membresias?: readonly Membresia[]
  asistencias?: readonly Asistencia[]
  hoyIso?: string
  cargando?: boolean
  error?: boolean
} = {}): string {
  return renderToStaticMarkup(
    <SociosEnRiesgo
      socios={props.socios ?? socios}
      membresias={props.membresias ?? membresias}
      asistencias={props.asistencias ?? asistencias}
      hoyIso={props.hoyIso ?? HOY_ISO}
      cargando={props.cargando}
      error={props.error}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('SociosEnRiesgo — derivado de props reales', () => {
  it('marca como riesgo a quien no viene 10+ días y ordena por días', () => {
    const html = render()
    expect(html).toContain('Jorge Luis Ccahuana Ríos')
    expect(html).toContain('hace 12 días')
    expect(html).toContain('María Gracia Belaúnde')
    expect(html).toContain('hace más de 20 días')
    // Rosa vino ayer: no aparece.
    expect(html).not.toContain('Rosa Ñahui Quispe')
  })

  it('ordena por días sin venir descendente (María 25 antes que Jorge 12)', () => {
    const html = render()
    const posMaria = html.indexOf('María Gracia Belaúnde')
    const posJorge = html.indexOf('Jorge Luis Ccahuana Ríos')
    expect(posMaria).toBeGreaterThan(-1)
    expect(posMaria).toBeLessThan(posJorge)
  })

  it('badge Crítico a partir de 20 días, En riesgo antes', () => {
    const html = render()
    expect(html).toContain('Crítico')
    expect(html).toContain('En riesgo')
  })

  it('socio de riesgo con membresía por vencer (≤7 días) marca fuga', () => {
    const html = render()
    expect(html).toContain('riesgo de fuga')
  })

  it('sin asistencias ni fecha de registro reciente: nada en riesgo', () => {
    // Todos los socios registrados hace poco y sin asistencias
    // quedan fuera del umbral si su fecha de registro es < 10 días.
    const nuevosSocios: readonly Socio[] = socios.map((socio) => ({
      ...socio,
      fechaRegistro: haceDiasIso(5),
    }))
    const html = render({ socios: nuevosSocios, asistencias: [] })
    expect(html).toContain('Todos los socios vienen entrenando. Buen ritmo.')
  })

  it('socio registrado hace 15 días y sin venir: entra en riesgo por fecha de registro', () => {
    const nuevosSocios: readonly Socio[] = socios.map((socio) => ({
      ...socio,
      fechaRegistro: haceDiasIso(15),
    }))
    const html = render({ socios: nuevosSocios, asistencias: [] })
    expect(html).toContain('En riesgo')
  })

  it('máximo 5 socios en riesgo', () => {
    const muchos: readonly Socio[] = Array.from({ length: 8 }, (_, i) => ({
      id: `soc-m-${i}`,
      codigo: `MS-${String(i + 10).padStart(3, '0')}`,
      nombre: `Socio Demo ${i}`,
      dni: '44444444',
      telefono: '999 999 999',
      planId: 'plan-mensual',
      estado: 'activo',
      fechaRegistro: haceDiasIso(90),
    }))
    const asistenciasViejas: readonly Asistencia[] = muchos.map((socio) => ({
      socioId: socio.id,
      fecha: haceDiasIso(15),
    }))
    const html = render({ socios: muchos, asistencias: asistenciasViejas, membresias: [] })
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(5)
  })

  it('cargando: mensaje de revisión y ninguna fila', () => {
    const html = render({ cargando: true })
    expect(html).toContain('Revisando asistencias…')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(0)
  })

  it('error de carga: aviso honesto, sin riesgos inventados por fecha de registro', () => {
    const html = render({ error: true, cargando: false })
    expect(html).toContain('No se pudieron cargar las asistencias.')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(0)
    expect(html).not.toContain('Crítico')
    expect(html).not.toContain('En riesgo')
  })

  it('sin socios: empty state propio', () => {
    const html = render({ socios: [], asistencias: [] })
    expect(html).toContain('Sin socios registrados todavía.')
  })
})
