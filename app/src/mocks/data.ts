import { diasParaVencer } from '@/lib/format'
import type { EstadoMembresia, Membresia, Plan, Socio } from './types'

export { diasParaVencer, formatoSoles } from '@/lib/format'

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function desdeHoy(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() + dias)
  return aIso(fecha)
}

export function sumarDiasIso(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const base = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  base.setDate(base.getDate() + dias)
  return aIso(base)
}

export function calcularEstado(fechaFin: string): EstadoMembresia {
  const dias = diasParaVencer(fechaFin)
  if (dias < 0) return 'vencida'
  if (dias <= 7) return 'por-vencer'
  return 'vigente'
}

export function progresoPeriodo(fechaInicio: string, fechaFin: string): number {
  const parsear = (valor: string): number => {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return new Date(anio, (mes ?? 1) - 1, dia ?? 1).getTime()
  }
  const total = parsear(fechaFin) - parsear(fechaInicio)
  if (total <= 0) return 100
  const transcurrido = HOY.getTime() - parsear(fechaInicio)
  return Math.min(100, Math.max(0, Math.round((transcurrido / total) * 100)))
}

export function formatoFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const planesMock: readonly Plan[] = [
  { id: 'plan-mensual', nombre: 'Mensual', precio: 80, duracionDias: 30 },
  { id: 'plan-trimestral', nombre: 'Trimestral', precio: 210, duracionDias: 90 },
  { id: 'plan-anual', nombre: 'Anual', precio: 660, duracionDias: 365 },
  { id: 'plan-student', nombre: 'Estudiante', precio: 55, duracionDias: 30 },
]

export const sociosMock: readonly Socio[] = [
  { id: 'soc-01', codigo: 'MS-001', nombre: 'Rosa Ñahui Quispe', dni: '45782136', telefono: '987 214 503', planId: 'plan-mensual', estado: 'activo', fechaRegistro: desdeHoy(-240) },
  { id: 'soc-02', codigo: 'MS-002', nombre: 'Jorge Luis Ccahuana Ríos', dni: '40112958', telefono: '954 780 126', planId: 'plan-trimestral', estado: 'activo', fechaRegistro: desdeHoy(-410) },
  { id: 'soc-03', codigo: 'MS-003', nombre: 'María Gracia Belaúnde', dni: '44120765', telefono: '902 335 841', planId: 'plan-anual', estado: 'activo', fechaRegistro: desdeHoy(-680) },
  { id: 'soc-04', codigo: 'MS-004', nombre: 'Kevin Rodrigo Muñoz', dni: '47890312', telefono: '999 876 543', planId: 'plan-student', estado: 'moroso', fechaRegistro: desdeHoy(-150) },
  { id: 'soc-05', codigo: 'MS-005', nombre: 'Ana Sofía Rojas Paredes', dni: '42331874', telefono: '933 640 715', planId: 'plan-mensual', estado: 'activo', fechaRegistro: desdeHoy(-95) },
  { id: 'soc-06', codigo: 'MS-006', nombre: 'Luis Fernando Huamán', dni: '41552709', telefono: '918 072 334', planId: 'plan-trimestral', estado: 'activo', fechaRegistro: desdeHoy(-320) },
  { id: 'soc-07', codigo: 'MS-007', nombre: 'Carmen Rosa Ñaupari', dni: '46998123', telefono: '945 509 682', planId: 'plan-mensual', estado: 'congelado', fechaRegistro: desdeHoy(-210) },
  { id: 'soc-08', codigo: 'MS-008', nombre: 'Piero Alessandro Ghibelli', dni: '43012876', telefono: '921 887 456', planId: 'plan-anual', estado: 'activo', fechaRegistro: desdeHoy(-540) },
  { id: 'soc-09', codigo: 'MS-009', nombre: 'Gabriela Sánchez León', dni: '48771045', telefono: '968 243 519', planId: 'plan-student', estado: 'moroso', fechaRegistro: desdeHoy(-120) },
  { id: 'soc-10', codigo: 'MS-010', nombre: 'Jhon Fredy Rodríguez', dni: '40996231', telefono: '989 466 027', planId: 'plan-mensual', estado: 'activo', fechaRegistro: desdeHoy(-75) },
  { id: 'soc-11', codigo: 'MS-011', nombre: 'Yessenia Marilú Poma', dni: '45226780', telefono: '907 521 993', planId: 'plan-trimestral', estado: 'congelado', fechaRegistro: desdeHoy(-275) },
  { id: 'soc-12', codigo: 'MS-012', nombre: 'Álvaro Nunura Sifuentes', dni: '43441892', telefono: '913 380 158', planId: 'plan-mensual', estado: 'moroso', fechaRegistro: desdeHoy(-60) },
]

type BorradorMembresia = {
  id: string
  socioId: string
  planId: string
  diasParaFin: number
}

const borradores: readonly BorradorMembresia[] = [
  { id: 'mem-01', socioId: 'soc-01', planId: 'plan-mensual', diasParaFin: 12 },
  { id: 'mem-02', socioId: 'soc-02', planId: 'plan-trimestral', diasParaFin: 45 },
  { id: 'mem-03', socioId: 'soc-03', planId: 'plan-anual', diasParaFin: 180 },
  { id: 'mem-04', socioId: 'soc-04', planId: 'plan-student', diasParaFin: -6 },
  { id: 'mem-05', socioId: 'soc-05', planId: 'plan-mensual', diasParaFin: 5 },
  { id: 'mem-06', socioId: 'soc-06', planId: 'plan-trimestral', diasParaFin: 3 },
  { id: 'mem-07', socioId: 'soc-07', planId: 'plan-mensual', diasParaFin: 20 },
  { id: 'mem-08', socioId: 'soc-08', planId: 'plan-anual', diasParaFin: 90 },
  { id: 'mem-09', socioId: 'soc-09', planId: 'plan-student', diasParaFin: -15 },
  { id: 'mem-10', socioId: 'soc-10', planId: 'plan-mensual', diasParaFin: 7 },
  { id: 'mem-11', socioId: 'soc-11', planId: 'plan-trimestral', diasParaFin: 60 },
  { id: 'mem-12', socioId: 'soc-12', planId: 'plan-mensual', diasParaFin: -2 },
]

const planPorId = new Map(planesMock.map((plan) => [plan.id, plan]))

const congelamientosDemo: Readonly<Record<string, { desde: string; hasta: string }>> = {
  'mem-07': { desde: desdeHoy(-2), hasta: desdeHoy(13) },
  'mem-11': { desde: desdeHoy(-10), hasta: desdeHoy(5) },
}

export const membresiasMock: readonly Membresia[] = borradores.map((borrador) => {
  const plan = planPorId.get(borrador.planId)
  const duracion = plan?.duracionDias ?? 30
  return {
    id: borrador.id,
    socioId: borrador.socioId,
    planId: borrador.planId,
    fechaInicio: desdeHoy(borrador.diasParaFin - duracion),
    fechaFin: desdeHoy(borrador.diasParaFin),
    monto: plan?.precio ?? 0,
    estado: calcularEstado(desdeHoy(borrador.diasParaFin)),
    congelada: congelamientosDemo[borrador.id],
  }
})
