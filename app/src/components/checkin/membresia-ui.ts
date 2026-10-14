import type { EstadoMembresia, Membresia, Plan, Socio } from '@/mocks/types'
import {
  calcularEstado,
  diasParaVencer,
  membresiasMock,
  planesMock,
} from '@/mocks/data'

export const etiquetaEstado: Record<EstadoMembresia, string> = {
  vigente: 'Acceso OK',
  'por-vencer': 'Por vencer',
  vencida: 'MOROSO · acceso bloqueado',
}

export const clasesEstado: Record<EstadoMembresia, string> = {
  vigente: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'por-vencer': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  vencida: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const membresiaPorSocio = new Map(
  membresiasMock.map((membresia): [string, Membresia] => [membresia.socioId, membresia]),
)

const planPorId = new Map(planesMock.map((plan): [string, Plan] => [plan.id, plan]))

export function membresiaDeSocio(socioId: string): Membresia | undefined {
  return membresiaPorSocio.get(socioId)
}

export function membresiaMasReciente(
  membresias: readonly Membresia[],
  socioId: string,
): Membresia | undefined {
  const candidatas = membresias.filter((fila) => fila.socioId === socioId)
  if (candidatas.length === 0) return undefined
  let mejor = candidatas[0]
  for (const fila of candidatas) {
    if (fila.fechaFin > mejor.fechaFin) mejor = fila
  }
  return mejor
}

export function planDeSocio(socioId: string): Plan | undefined {
  const membresia = membresiaPorSocio.get(socioId)
  if (!membresia) return undefined
  return planPorId.get(membresia.planId)
}

export function textoVencimiento(fechaFin: string): string {
  const dias = diasParaVencer(fechaFin)
  const absolutos = Math.abs(dias)
  const unidad = absolutos === 1 ? 'día' : 'días'
  if (dias < 0) return `Vencida hace ${absolutos} ${unidad}`
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  return `Vence en ${dias} días`
}

export function estadoDeSocio(socio: Socio): EstadoMembresia {
  const membresia = membresiaDeSocio(socio.id)
  if (!membresia) return 'vencida'
  return calcularEstado(membresia.fechaFin)
}
