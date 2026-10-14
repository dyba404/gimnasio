import type { GestionCobranza } from './bitacora'
import { fechaHoyIso } from './bitacora'
import { diasParaVencer, membresiasMock, sociosMock, sumarDiasIso } from './data'
import type { Membresia, Socio } from './types'

export const DIAS_DUNNING = [0, 1, 4, 7, 12] as const

export type EtapaDunning = 'd0' | 'd1' | 'd4' | 'd7' | 'd12' | 'escalado'

export const ETAPAS_DUNNING: readonly EtapaDunning[] = [
  'd0',
  'd1',
  'd4',
  'd7',
  'd12',
  'escalado',
]

const ORDEN_ETAPA: Record<EtapaDunning, number> = {
  d0: 0,
  d1: 1,
  d4: 2,
  d7: 3,
  d12: 4,
  escalado: 5,
}

export function etapaMayor(a: EtapaDunning, b: EtapaDunning): boolean {
  return ORDEN_ETAPA[a] > ORDEN_ETAPA[b]
}

const ETAPA_POR_DIAS: Readonly<Record<number, EtapaDunning>> = {
  0: 'd0',
  1: 'd1',
  4: 'd4',
  7: 'd7',
  12: 'd12',
}

function aFechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio ?? 0, (mes ?? 1) - 1, dia ?? 1)
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(`fecha inválida: ${iso}`)
  }
  return fecha
}

export function etapaVigente(fechaFin: string, hoyIso: string): EtapaDunning | null {
  const dias = diasParaVencer(fechaFin, aFechaLocal(hoyIso))
  if (dias > 0) return null
  const diasVencido = -dias
  const limiteEscalado = DIAS_DUNNING.at(-1) ?? 12
  if (diasVencido > limiteEscalado) return 'escalado'
  let etapa: EtapaDunning = 'd0'
  for (const diasEtapa of DIAS_DUNNING) {
    const candidata = ETAPA_POR_DIAS[diasEtapa]
    if (candidata !== undefined && diasVencido >= diasEtapa) {
      etapa = candidata
    }
  }
  return etapa
}

export function gestionPendiente(
  etapa: EtapaDunning,
  ultimaGestionEtapa?: EtapaDunning,
): boolean {
  if (ultimaGestionEtapa === undefined) return true
  return ORDEN_ETAPA[etapa] > ORDEN_ETAPA[ultimaGestionEtapa]
}

export function etapaDeGestion(
  fechaFin: string,
  fechaGestion: string,
): EtapaDunning | null {
  return etapaVigente(fechaFin, fechaGestion)
}

const DESCRIPCIONES: Record<EtapaDunning, { titulo: string; accion: string }> = {
  d0: { titulo: 'Venció hoy', accion: 'WhatsApp con link de pago' },
  d1: { titulo: 'Día 1', accion: 'Recordatorio amigable' },
  d4: { titulo: 'Día 4', accion: 'Reintento (post-quincena si aplica)' },
  d7: { titulo: 'Día 7', accion: 'Llamada del dueño' },
  d12: { titulo: 'Día 12', accion: 'Ofrecer congelar en vez de cancelar' },
  escalado: { titulo: 'Escalado', accion: 'Baja o plan de pago' },
}

export function descripcionEtapa(etapa: EtapaDunning): {
  titulo: string
  accion: string
} {
  return DESCRIPCIONES[etapa]
}

export type MorosoPipeline = {
  socio: Socio
  membresia: Membresia
  montoDebido: number
  diasVencido: number
  telefono: string
  ultimaGestion?: GestionCobranza
}

export type ColumnaDunning = {
  etapa: EtapaDunning
  morosos: readonly MorosoPipeline[]
  deuda: number
}

function ultimaGestionDe(
  gestiones: readonly GestionCobranza[],
  socioId: string,
): GestionCobranza | undefined {
  let mejor: GestionCobranza | undefined
  for (const gestion of gestiones) {
    if (gestion.socioId !== socioId) continue
    if (mejor === undefined || gestion.fecha >= mejor.fecha) {
      mejor = gestion
    }
  }
  return mejor
}

export function pipelineDunning(
  membresias: readonly Membresia[],
  socios: ReadonlyMap<string, Socio>,
  gestiones: readonly GestionCobranza[],
  hoyIso: string,
): readonly ColumnaDunning[] {
  const hoy = aFechaLocal(hoyIso)
  const porEtapa = new Map<EtapaDunning, MorosoPipeline[]>(
    ETAPAS_DUNNING.map((etapa) => [etapa, []]),
  )
  for (const membresia of membresias) {
    const etapa = etapaVigente(membresia.fechaFin, hoyIso)
    if (etapa === null) continue
    const socio = socios.get(membresia.socioId)
    if (socio === undefined) continue
    const diasVencido = -diasParaVencer(membresia.fechaFin, hoy)
    const mesesVencidos = Math.max(1, Math.ceil(diasVencido / 30))
    const lista = porEtapa.get(etapa)
    if (lista === undefined) continue
    lista.push({
      socio,
      membresia,
      montoDebido: membresia.monto * mesesVencidos,
      diasVencido,
      telefono: socio.telefono,
      ultimaGestion: ultimaGestionDe(gestiones, membresia.socioId),
    })
  }
  return ETAPAS_DUNNING.map((etapa) => {
    const morosos = (porEtapa.get(etapa) ?? []).slice().sort(
      (a, b) => b.diasVencido - a.diasVencido || b.montoDebido - a.montoDebido,
    )
    const deuda = morosos.reduce((suma, moroso) => suma + moroso.montoDebido, 0)
    return { etapa, morosos, deuda }
  })
}

export function recuperadosPostSecuencia(
  gestiones: readonly GestionCobranza[],
): number {
  const ultimaPorSocio = new Map<string, GestionCobranza>()
  for (const gestion of gestiones) {
    const actual = ultimaPorSocio.get(gestion.socioId)
    if (actual === undefined || gestion.fecha > actual.fecha) {
      ultimaPorSocio.set(gestion.socioId, gestion)
    }
  }
  let recuperados = 0
  for (const gestion of ultimaPorSocio.values()) {
    if (gestion.resultado === 'pagara-hoy' || gestion.resultado === 'prometio') {
      recuperados += 1
    }
  }
  return recuperados
}

const hoy = fechaHoyIso()

export const sociosDunningMock: readonly Socio[] = [
  ...sociosMock,
  {
    id: 'soc-13',
    codigo: 'MS-013',
    nombre: 'Fiorella Mendívil Anaya',
    dni: '44501237',
    telefono: '958 301 774',
    planId: 'plan-mensual',
    estado: 'moroso',
    fechaRegistro: sumarDiasIso(hoy, -30),
  },
  {
    id: 'soc-14',
    codigo: 'MS-014',
    nombre: 'Diego Velarde Quiroz',
    dni: '43879015',
    telefono: '947 662 018',
    planId: 'plan-mensual',
    estado: 'moroso',
    fechaRegistro: sumarDiasIso(hoy, -45),
  },
  {
    id: 'soc-15',
    codigo: 'MS-015',
    nombre: 'Milagros Pastor Carbajal',
    dni: '42108873',
    telefono: '936 445 20',
    planId: 'plan-student',
    estado: 'moroso',
    fechaRegistro: sumarDiasIso(hoy, -20),
  },
]

export const membresiasDunningMock: readonly Membresia[] = [
  ...membresiasMock,
  {
    id: 'mem-13',
    socioId: 'soc-13',
    planId: 'plan-mensual',
    fechaInicio: sumarDiasIso(hoy, -30),
    fechaFin: hoy,
    monto: 80,
    estado: 'vencida',
  },
  {
    id: 'mem-14',
    socioId: 'soc-14',
    planId: 'plan-mensual',
    fechaInicio: sumarDiasIso(hoy, -38),
    fechaFin: sumarDiasIso(hoy, -8),
    monto: 80,
    estado: 'vencida',
  },
  {
    id: 'mem-15',
    socioId: 'soc-15',
    planId: 'plan-student',
    fechaInicio: sumarDiasIso(hoy, -42),
    fechaFin: sumarDiasIso(hoy, -12),
    monto: 55,
    estado: 'vencida',
  },
]

export const gestionesDunningMock: readonly GestionCobranza[] = [
  {
    id: 'dun-01',
    socioId: 'soc-14',
    tipo: 'whatsapp',
    nota: 'Primer recordatorio tras el vencimiento.',
    resultado: 'no-responde',
    fecha: sumarDiasIso(hoy, -7),
  },
  {
    id: 'dun-02',
    socioId: 'soc-15',
    tipo: 'whatsapp',
    nota: 'Recordatorio amigable de renovación.',
    resultado: 'prometio',
    fecha: sumarDiasIso(hoy, -8),
  },
]
