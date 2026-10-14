import { sociosMock } from './data'

export type TipoGestion = 'whatsapp' | 'llamada' | 'visita' | 'recordatorio'

export type ResultadoGestion = 'pendiente' | 'prometio' | 'pagara-hoy' | 'no-responde' | 'negocia'

export type GestionCobranza = {
  id: string
  socioId: string
  tipo: TipoGestion
  nota: string
  resultado: ResultadoGestion
  fecha: string
}

export const etiquetaTipo: Record<TipoGestion, string> = {
  whatsapp: 'WhatsApp',
  llamada: 'Llamada',
  visita: 'Visita',
  recordatorio: 'Recordatorio',
}

export const etiquetaResultado: Record<ResultadoGestion, string> = {
  pendiente: 'Pendiente',
  prometio: 'Prometió',
  'pagara-hoy': 'Paga hoy',
  'no-responde': 'No responde',
  negocia: 'Negociando',
}

export const claseResultado: Record<ResultadoGestion, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  prometio: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'pagara-hoy': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'no-responde': 'bg-red-500/15 text-red-700 dark:text-red-400',
  negocia: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
}

export const tiposGestion: readonly TipoGestion[] = [
  'whatsapp',
  'llamada',
  'visita',
  'recordatorio',
]

export const resultadosGestion: readonly ResultadoGestion[] = [
  'pendiente',
  'prometio',
  'pagara-hoy',
  'no-responde',
  'negocia',
]

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

export function fechaHoyIso(): string {
  return aIso(HOY)
}

export function fechaRelativa(fecha: string): string {
  const ayer = new Date(HOY)
  ayer.setDate(ayer.getDate() - 1)
  if (fecha === aIso(HOY)) return 'hoy'
  if (fecha === aIso(ayer)) return 'ayer'
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const objetivo = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  const dias = Math.max(0, Math.round((HOY.getTime() - objetivo.getTime()) / 86_400_000))
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}

const borradores: readonly Omit<GestionCobranza, 'id'>[] = [
  { socioId: 'soc-04', tipo: 'whatsapp', nota: 'Recordatorio de membresía vencida, sin respuesta.', resultado: 'no-responde', fecha: haceDias(5) },
  { socioId: 'soc-04', tipo: 'llamada', nota: 'Contestó, prometió pasar a ponerse al día el viernes.', resultado: 'prometio', fecha: haceDias(2) },
  { socioId: 'soc-04', tipo: 'whatsapp', nota: 'Seguimiento del compromiso del viernes.', resultado: 'pendiente', fecha: haceDias(0) },
  { socioId: 'soc-09', tipo: 'llamada', nota: 'Tres intentos, buzón de voz.', resultado: 'no-responde', fecha: haceDias(9) },
  { socioId: 'soc-09', tipo: 'whatsapp', nota: 'Enviado detalle de la deuda de dos meses.', resultado: 'no-responde', fecha: haceDias(6) },
  { socioId: 'soc-09', tipo: 'visita', nota: 'La vio el profe en clase de spinning, pide prorratear.', resultado: 'negocia', fecha: haceDias(3) },
  { socioId: 'soc-09', tipo: 'recordatorio', nota: 'Recordatorio de propuesta de pago parcial.', resultado: 'prometio', fecha: haceDias(1) },
  { socioId: 'soc-12', tipo: 'whatsapp', nota: 'Primer aviso de vencimiento hace 2 días.', resultado: 'no-responde', fecha: haceDias(10) },
  { socioId: 'soc-12', tipo: 'llamada', nota: 'Prometió renovar con plan mensual esta semana.', resultado: 'prometio', fecha: haceDias(7) },
  { socioId: 'soc-12', tipo: 'visita', nota: 'Se le dejó nota impresa en caseta.', resultado: 'prometio', fecha: haceDias(4) },
  { socioId: 'soc-12', tipo: 'whatsapp', nota: 'Pide esperarlo a la quincena, se pactó el 15.', resultado: 'negocia', fecha: haceDias(2) },
  { socioId: 'soc-12', tipo: 'recordatorio', nota: 'Confirmó que pasa hoy a pagar.', resultado: 'pagara-hoy', fecha: haceDias(0) },
]

const idsValidos = new Set(sociosMock.map((socio) => socio.id))

export const bitacoraMock: readonly GestionCobranza[] = borradores
  .filter((borrador) => idsValidos.has(borrador.socioId))
  .map((borrador, indice) => ({
    ...borrador,
    id: `ges-${String(indice + 1).padStart(3, '0')}`,
  }))

function porFechaDesc(a: GestionCobranza, b: GestionCobranza): number {
  return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0
}

export function gestionesDeSocio(socioId: string): readonly GestionCobranza[] {
  return bitacoraMock
    .filter((gestion) => gestion.socioId === socioId)
    .sort(porFechaDesc)
}

export function gestionesRecientes(dias: number): readonly GestionCobranza[] {
  const limite = haceDias(dias - 1)
  return bitacoraMock
    .filter((gestion) => gestion.fecha >= limite)
    .sort(porFechaDesc)
}

export function registrarGestion(
  gestiones: readonly GestionCobranza[],
  nueva: Omit<GestionCobranza, 'id'>,
): readonly GestionCobranza[] {
  let maximo = 0
  for (const gestion of gestiones) {
    const numero = Number(gestion.id.replace(/^ges-/, ''))
    if (Number.isFinite(numero) && numero > maximo) {
      maximo = numero
    }
  }
  const id = `ges-${String(maximo + 1).padStart(3, '0')}`
  return [{ ...nueva, id }, ...gestiones]
}

export function ultimaGestion(socioId: string): GestionCobranza | undefined {
  return gestionesDeSocio(socioId)[0]
}

export function contarGestiones(socioId: string): number {
  return bitacoraMock.filter((gestion) => gestion.socioId === socioId).length
}
