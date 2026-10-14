import type { Socio } from './types'

export type GatilloResena = 'renovacion' | 'asistencia'

export type SolicitudResena = {
  id: string
  socioId: string
  fecha: string
  gatillo: GatilloResena
}

export type EventoMomentoFeliz = 'renovacion' | 'racha-asistencia'

export const DIAS_ENTRE_RESENAS = 90

export const etiquetaGatillo: Record<GatilloResena, string> = {
  renovacion: 'Renovación',
  asistencia: 'Asistencia',
}

const MILISEGUNDOS_POR_DIA = 86_400_000

const PATRON_FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

function aMedianoche(fechaIso: string): number {
  const partes = PATRON_FECHA_ISO.exec(fechaIso)
  if (!partes) {
    throw new RangeError(`fecha inválida: ${fechaIso}`)
  }
  return new Date(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3]),
  ).getTime()
}

export function momentoFeliz(evento: EventoMomentoFeliz): GatilloResena {
  return evento === 'renovacion' ? 'renovacion' : 'asistencia'
}

export function puedePedirResena(
  ultima: string | undefined,
  hoyIso: string,
): boolean {
  if (ultima === undefined) return true
  const dias = Math.round(
    (aMedianoche(hoyIso) - aMedianoche(ultima)) / MILISEGUNDOS_POR_DIA,
  )
  return dias >= DIAS_ENTRE_RESENAS
}

export function ultimaSolicitudPorSocio(
  solicitudes: readonly SolicitudResena[],
): ReadonlyMap<string, string> {
  const mapa = new Map<string, string>()
  for (const solicitud of solicitudes) {
    const previa = mapa.get(solicitud.socioId)
    if (previa === undefined || solicitud.fecha > previa) {
      mapa.set(solicitud.socioId, solicitud.fecha)
    }
  }
  return mapa
}

export function sociosElegiblesParaResena(
  socios: readonly Socio[],
  solicitudes: readonly SolicitudResena[],
  hoyIso: string,
): readonly Socio[] {
  const ultimas = ultimaSolicitudPorSocio(solicitudes)
  return socios.filter(
    (socio) =>
      socio.estado === 'activo' && puedePedirResena(ultimas.get(socio.id), hoyIso),
  )
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

const borradores: readonly SolicitudResena[] = [
  { id: 'res-01', socioId: 'soc-01', fecha: haceDias(30), gatillo: 'renovacion' },
  { id: 'res-02', socioId: 'soc-03', fecha: haceDias(120), gatillo: 'renovacion' },
  { id: 'res-03', socioId: 'soc-08', fecha: haceDias(200), gatillo: 'renovacion' },
  { id: 'res-04', socioId: 'soc-10', fecha: haceDias(95), gatillo: 'renovacion' },
]

export const solicitudesResenaMock: readonly SolicitudResena[] = borradores
