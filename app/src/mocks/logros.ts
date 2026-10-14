import type { Asistencia } from './asistencias'

export type MetricaLogro = 'racha' | 'asistencias-mes' | 'total-asistencias' | 'tempranero'

export type LogroDefinido = {
  id: string
  nombre: string
  emoji: string
  metrica: MetricaLogro
  umbral: number
}

export type LogroSocio = {
  socioId: string
  logroId: string
  fechaConseguido: string
}

export type RachaSocio = {
  socioId: string
  racha: number
}

const MILISEGUNDOS_POR_DIA = 86_400_000

const MINUTOS_09_00 = 9 * 60

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1)
}

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function diaAnteriorIso(iso: string): string {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() - 1)
  return aIso(fecha)
}

export function diaSiguienteIso(iso: string): string {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() + 1)
  return aIso(fecha)
}

function fechasDeSocio(asistencias: readonly Asistencia[], socioId: string): readonly string[] {
  return [...new Set(asistencias.filter((a) => a.socioId === socioId).map((a) => a.fecha))].sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  )
}

export function rachaActual(
  asistencias: readonly Asistencia[],
  socioId: string,
  hoyIso: string,
): number {
  const fechas = new Set(asistencias.filter((a) => a.socioId === socioId).map((a) => a.fecha))
  if (fechas.size === 0) return 0
  let ancla = ''
  if (fechas.has(hoyIso)) {
    ancla = hoyIso
  } else {
    const ayer = diaAnteriorIso(hoyIso)
    if (fechas.has(ayer)) {
      ancla = ayer
    } else {
      return 0
    }
  }
  let racha = 0
  let cursor = ancla
  while (fechas.has(cursor)) {
    racha += 1
    cursor = diaAnteriorIso(cursor)
  }
  return racha
}

export function rachaMejor(asistencias: readonly Asistencia[], socioId: string): number {
  let mejor = 0
  let actual = 0
  let previa = ''
  for (const fecha of fechasDeSocio(asistencias, socioId)) {
    actual = previa !== '' && diaSiguienteIso(previa) === fecha ? actual + 1 : 1
    if (actual > mejor) mejor = actual
    previa = fecha
  }
  return mejor
}

export function asistenciasMes(
  asistencias: readonly Asistencia[],
  socioId: string,
  anno: number,
  mes: number,
): number {
  const delMes = new Set(
    asistencias
      .filter((a) => {
        if (a.socioId !== socioId) return false
        const fecha = aFecha(a.fecha)
        return fecha.getFullYear() === anno && fecha.getMonth() + 1 === mes
      })
      .map((a) => a.fecha),
  )
  return delMes.size
}

export function totalAsistencias(asistencias: readonly Asistencia[], socioId: string): number {
  return fechasDeSocio(asistencias, socioId).length
}

function minutosDeHora(hora: string | undefined): number | null {
  if (!hora) return null
  const partes = /^(\d{1,2}):(\d{2})/.exec(hora.trim())
  if (!partes) return null
  const horas = Number(partes[1])
  const minutos = Number(partes[2])
  if (horas > 23 || minutos > 59) return null
  return horas * 60 + minutos
}

export function tempraneras(asistencias: readonly Asistencia[], socioId: string): number {
  return asistencias.filter((a) => {
    if (a.socioId !== socioId) return false
    const minutos = minutosDeHora(a.hora)
    return minutos !== null && minutos < MINUTOS_09_00
  }).length
}

function inicioRachaActual(
  asistencias: readonly Asistencia[],
  socioId: string,
  hoyIso: string,
): string | null {
  const racha = rachaActual(asistencias, socioId, hoyIso)
  if (racha === 0) return null
  const fechas = new Set(asistencias.filter((a) => a.socioId === socioId).map((a) => a.fecha))
  let cursor = fechas.has(hoyIso) ? hoyIso : diaAnteriorIso(hoyIso)
  for (let paso = 1; paso < racha; paso += 1) {
    cursor = diaAnteriorIso(cursor)
  }
  return cursor
}

function fechaConseguido(
  logro: LogroDefinido,
  asistencias: readonly Asistencia[],
  socioId: string,
  hoyIso: string,
): string | null {
  if (logro.metrica === 'racha') {
    const inicio = inicioRachaActual(asistencias, socioId, hoyIso)
    if (inicio === null) return null
    const racha = rachaActual(asistencias, socioId, hoyIso)
    if (racha < logro.umbral) return null
    const fecha = aFecha(inicio)
    fecha.setDate(fecha.getDate() + (logro.umbral - 1))
    return aIso(fecha)
  }
  if (logro.metrica === 'total-asistencias') {
    const fechas = fechasDeSocio(asistencias, socioId)
    if (fechas.length < logro.umbral) return null
    return fechas[logro.umbral - 1] ?? null
  }
  if (logro.metrica === 'asistencias-mes') {
    const hoy = aFecha(hoyIso)
    const fechas = fechasDeSocio(asistencias, socioId).filter((fecha) => {
      const parsed = aFecha(fecha)
      return parsed.getFullYear() === hoy.getFullYear() && parsed.getMonth() === hoy.getMonth()
    })
    if (fechas.length < logro.umbral) return null
    return fechas[logro.umbral - 1] ?? null
  }
  const tempranerasFechas = asistencias
    .filter((a) => {
      if (a.socioId !== socioId) return false
      const minutos = minutosDeHora(a.hora)
      return minutos !== null && minutos < MINUTOS_09_00
    })
    .map((a) => a.fecha)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  if (tempranerasFechas.length < logro.umbral) return null
  return tempranerasFechas[logro.umbral - 1] ?? null
}

export function logrosConseguidos(
  logrosDefinidos: readonly LogroDefinido[],
  asistencias: readonly Asistencia[],
  socioId: string,
  hoyIso: string,
): readonly LogroSocio[] {
  return logrosDefinidos.flatMap((logro): LogroSocio[] => {
    const fecha = fechaConseguido(logro, asistencias, socioId, hoyIso)
    return fecha === null ? [] : [{ socioId, logroId: logro.id, fechaConseguido: fecha }]
  })
}

export function rankingRachas(
  asistencias: readonly Asistencia[],
  sociosIds: readonly string[],
  hoyIso: string,
): readonly RachaSocio[] {
  return sociosIds
    .map((socioId): RachaSocio => ({ socioId, racha: rachaActual(asistencias, socioId, hoyIso) }))
    .filter((entrada) => entrada.racha > 0)
    .sort((a, b) => b.racha - a.racha)
}

export const logrosMock: readonly LogroDefinido[] = [
  { id: 'logro-racha-7', nombre: 'Racha 7', emoji: '🔥', metrica: 'racha', umbral: 7 },
  { id: 'logro-racha-30', nombre: 'Racha 30', emoji: '🔥🔥', metrica: 'racha', umbral: 30 },
  { id: 'logro-cien', nombre: '100 asistencias', emoji: '💯', metrica: 'total-asistencias', umbral: 100 },
  { id: 'logro-madrugador', nombre: 'Madrugador', emoji: '🌅', metrica: 'tempranero', umbral: 10 },
  { id: 'logro-constante', nombre: 'Constante', emoji: '💪', metrica: 'asistencias-mes', umbral: 12 },
  { id: 'logro-veterano', nombre: 'Veterano', emoji: '🏆', metrica: 'total-asistencias', umbral: 200 },
  { id: 'logro-puntual', nombre: 'Puntual', emoji: '🎯', metrica: 'tempranero', umbral: 30 },
  { id: 'logro-frecuente', nombre: 'Frecuente', emoji: '⚡', metrica: 'asistencias-mes', umbral: 20 },
]

export function diasAtrasIso(hoyIso: string, dias: number): string {
  return aIso(new Date(aFecha(hoyIso).getTime() - dias * MILISEGUNDOS_POR_DIA))
}
