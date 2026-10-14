import { diasParaVencer } from '@/lib/format'
import { sociosMock } from './data'
import type { Socio } from './types'

export type Asistencia = {
  socioId: string
  fecha: string
  hora?: string
}

export type SocioEnRiesgo = {
  socio: Socio
  diasSinAsistir: number
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function haceDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  return aIso(fecha)
}

function aFecha(valor: Date | string): Date {
  if (valor instanceof Date) return valor
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1)
}

type PerfilAsistencia = {
  socioId: string
  diasAtras: readonly number[]
}

const perfiles: readonly PerfilAsistencia[] = [
  { socioId: 'soc-01', diasAtras: [0, 2, 3, 7, 9, 10, 14, 16, 17, 21, 23, 24, 28] },
  { socioId: 'soc-02', diasAtras: [1, 2, 4, 5, 8, 9, 11, 12, 15, 16, 18, 19, 22, 23, 26, 29] },
  { socioId: 'soc-03', diasAtras: [0, 1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29] },
  { socioId: 'soc-04', diasAtras: [15, 16, 18, 20, 22, 25, 27, 31] },
  { socioId: 'soc-05', diasAtras: [0, 2, 4, 6, 9, 11, 13, 16, 18, 20, 23, 25, 27] },
  { socioId: 'soc-06', diasAtras: [1, 3, 6, 8, 12, 14, 17, 21, 24, 28] },
  { socioId: 'soc-07', diasAtras: [4, 9, 16, 24] },
  { socioId: 'soc-08', diasAtras: [0, 1, 4, 6, 8, 11, 13, 15, 18, 20, 22, 25, 27] },
  { socioId: 'soc-09', diasAtras: [18, 19, 21, 24, 26, 29] },
  { socioId: 'soc-10', diasAtras: [0, 3, 5, 7, 10, 12, 14, 17, 19] },
  { socioId: 'soc-11', diasAtras: [6, 13, 20, 27] },
  { socioId: 'soc-12', diasAtras: [12, 13, 15, 17, 19, 22] },
]

const idsValidos = new Set(sociosMock.map((socio) => socio.id))

export const asistenciasMock: readonly Asistencia[] = perfiles
  .filter((perfil) => idsValidos.has(perfil.socioId))
  .flatMap((perfil) =>
    perfil.diasAtras
      .filter((dias) => dias >= 0)
      .map((dias) => ({ socioId: perfil.socioId, fecha: haceDias(dias) })),
  )
  .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))

export function ultimosDiasIso(cantidad: number): readonly string[] {
  return Array.from({ length: cantidad }, (_, indice) => haceDias(cantidad - 1 - indice))
}

export function asistenciasDeSocio(socioId: string, dias = 30): readonly string[] {
  const limite = haceDias(Math.max(0, dias - 1))
  return asistenciasMock
    .filter((asistencia) => asistencia.socioId === socioId && asistencia.fecha >= limite)
    .map((asistencia) => asistencia.fecha)
}

export function diasSinAsistir(socioId: string, hoy: Date | string = new Date()): number {
  const fechas = asistenciasMock
    .filter((asistencia) => asistencia.socioId === socioId)
    .map((asistencia) => asistencia.fecha)
  if (fechas.length === 0) {
    return Number.POSITIVE_INFINITY
  }
  let ultima = fechas[0] ?? ''
  for (const fecha of fechas) {
    if (fecha > ultima) {
      ultima = fecha
    }
  }
  return Math.max(0, diasParaVencer(aFecha(hoy), aFecha(ultima)))
}

export function estaEnRiesgo(socioId: string, hoy: Date | string = new Date()): boolean {
  return diasSinAsistir(socioId, hoy) >= 10
}

export function sociosEnRiesgo(hoy: Date | string = new Date()): readonly SocioEnRiesgo[] {
  return sociosMock
    .map((socio): SocioEnRiesgo => ({ socio, diasSinAsistir: diasSinAsistir(socio.id, hoy) }))
    .filter((riesgo) => riesgo.diasSinAsistir >= 10)
    .sort((a, b) => b.diasSinAsistir - a.diasSinAsistir)
}
