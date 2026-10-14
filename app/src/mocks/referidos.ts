import type { Pago } from './pagos'
import type { Membresia, Socio } from './types'

export const RECOMPENSA_REFERIDO = 20

export type EstadoReferido = 'pendiente' | 'elegible' | 'aplicado' | 'invalido'

export type Referido = {
  id: string
  referidorId: string
  referidoId: string
  fecha: string
  estado: EstadoReferido
}

export type PagosPorSocio = ReadonlyMap<string, readonly Pago[]>

export type ContextoReferidos = {
  socios: ReadonlyMap<string, Socio>
  membresias: ReadonlyMap<string, Membresia>
  pagosPorSocio: PagosPorSocio
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

export function agruparPagosPorSocio(pagos: readonly Pago[]): PagosPorSocio {
  const grupos = new Map<string, Pago[]>()
  for (const pago of pagos) {
    const grupo = grupos.get(pago.socioId)
    if (grupo) {
      grupo.push(pago)
    } else {
      grupos.set(pago.socioId, [pago])
    }
  }
  return grupos
}

export function tieneCuotaPagada(socioId: string, pagosPorSocio: PagosPorSocio): boolean {
  return (pagosPorSocio.get(socioId) ?? []).some((pago) => pago.estado === 'completado')
}

export function elegibleParaRecompensa(
  referidoId: string,
  socios: ReadonlyMap<string, Socio>,
  membresias: ReadonlyMap<string, Membresia>,
  pagosPorSocio: PagosPorSocio,
): boolean {
  const socio = socios.get(referidoId)
  if (!socio || socio.estado !== 'activo') return false
  if (!tieneCuotaPagada(referidoId, pagosPorSocio)) return false
  const membresia = membresias.get(referidoId)
  return membresia !== undefined && membresia.estado !== 'vencida'
}

export function estadoDerivado(
  referido: Referido,
  contexto: ContextoReferidos,
): EstadoReferido {
  if (referido.estado === 'aplicado') return 'aplicado'
  const socio = contexto.socios.get(referido.referidoId)
  if (!socio || socio.estado === 'congelado') return 'invalido'
  if (
    elegibleParaRecompensa(
      referido.referidoId,
      contexto.socios,
      contexto.membresias,
      contexto.pagosPorSocio,
    )
  ) {
    return 'elegible'
  }
  return 'pendiente'
}

export function motivoNoCalifica(
  referido: Referido,
  contexto: ContextoReferidos,
): string {
  const socio = contexto.socios.get(referido.referidoId)
  if (!socio || socio.estado === 'congelado') return 'Referido inactivo'
  if (!tieneCuotaPagada(referido.referidoId, contexto.pagosPorSocio)) {
    return 'Referido aún sin cuota paga'
  }
  return 'Referido con membresía vencida'
}

export function descuentoProximoPago(
  referidorId: string,
  referidos: readonly Referido[],
): number {
  const aplicados = referidos.filter(
    (referido) => referido.referidorId === referidorId && referido.estado === 'aplicado',
  ).length
  return aplicados * RECOMPENSA_REFERIDO
}

export function descuentosEntregados(estados: readonly EstadoReferido[]): number {
  return estados.filter((estado) => estado === 'aplicado').length * RECOMPENSA_REFERIDO
}

export function referidosPorSocio(
  referidos: readonly Referido[],
): ReadonlyMap<string, number> {
  const conteo = new Map<string, number>()
  for (const referido of referidos) {
    conteo.set(referido.referidorId, (conteo.get(referido.referidorId) ?? 0) + 1)
  }
  return conteo
}

const borradores: readonly Referido[] = [
  { id: 'ref-01', referidorId: 'soc-02', referidoId: 'soc-01', fecha: haceDias(95), estado: 'pendiente' },
  { id: 'ref-02', referidorId: 'soc-03', referidoId: 'soc-08', fecha: haceDias(80), estado: 'pendiente' },
  { id: 'ref-03', referidorId: 'soc-05', referidoId: 'soc-06', fecha: haceDias(60), estado: 'pendiente' },
  { id: 'ref-04', referidorId: 'soc-01', referidoId: 'soc-03', fecha: haceDias(150), estado: 'aplicado' },
  { id: 'ref-05', referidorId: 'soc-06', referidoId: 'soc-02', fecha: haceDias(120), estado: 'aplicado' },
  { id: 'ref-06', referidorId: 'soc-08', referidoId: 'soc-04', fecha: haceDias(40), estado: 'pendiente' },
  { id: 'ref-07', referidorId: 'soc-10', referidoId: 'soc-12', fecha: haceDias(25), estado: 'pendiente' },
  { id: 'ref-08', referidorId: 'soc-05', referidoId: 'soc-07', fecha: haceDias(15), estado: 'pendiente' },
]

export const referidosMock: readonly Referido[] = borradores

export function referidoDeSocio(socioId: string): Referido | undefined {
  return referidosMock.find((referido) => referido.referidoId === socioId)
}

export function referidosDeReferidor(socioId: string): readonly Referido[] {
  return referidosMock.filter((referido) => referido.referidorId === socioId)
}
