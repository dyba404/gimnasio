import { calcularEstado, sumarDiasIso } from '@/mocks/data'
import type { Congelamiento, Membresia } from '@/mocks/types'

export const DIAS_CONGELAMIENTO_DEFAULT = 30
export const DIAS_CONGELAMIENTO_MAX = 90

const MILISEGUNDOS_POR_DIA = 86_400_000

export function limitarDiasCongelamiento(dias: number): number {
  if (!Number.isFinite(dias)) return DIAS_CONGELAMIENTO_DEFAULT
  return Math.min(DIAS_CONGELAMIENTO_MAX, Math.max(1, Math.round(dias)))
}

export function diasEntreIso(desde: string, hasta: string): number {
  const parsear = (valor: string): number => {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return new Date(anio, (mes ?? 1) - 1, dia ?? 1).getTime()
  }
  return Math.round((parsear(hasta) - parsear(desde)) / MILISEGUNDOS_POR_DIA)
}

export function hoyIso(): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function esCongelada(membresia: Membresia): boolean {
  return membresia.congelada !== undefined
}

export function congelar(membresia: Membresia, dias: number, hoy: string): Membresia {
  const diasValidos = limitarDiasCongelamiento(dias)
  const congelamiento: Congelamiento = { desde: hoy, hasta: sumarDiasIso(hoy, diasValidos) }
  return { ...membresia, congelada: congelamiento }
}

export function diasPausadosReales(congelamiento: Congelamiento, hoy: string): number {
  const transcurridos = diasEntreIso(congelamiento.desde, hoy)
  const pactados = diasEntreIso(congelamiento.desde, congelamiento.hasta)
  return Math.max(1, Math.min(transcurridos, pactados))
}

export function fechaFinExtendida(membresia: Membresia, hoy: string = hoyIso()): string {
  const congelamiento = membresia.congelada
  if (!congelamiento) return membresia.fechaFin
  return sumarDiasIso(membresia.fechaFin, diasPausadosReales(congelamiento, hoy))
}

export function reanudar(membresia: Membresia, hoy: string = hoyIso()): Membresia {
  if (!membresia.congelada) return membresia
  return {
    id: membresia.id,
    socioId: membresia.socioId,
    planId: membresia.planId,
    fechaInicio: membresia.fechaInicio,
    fechaFin: fechaFinExtendida(membresia, hoy),
    monto: membresia.monto,
    estado: membresia.estado,
  }
}

export function renovarMembresia(membresia: Membresia, duracionDias: number, hoy: string): Membresia {
  const base = membresia.estado === 'vencida' ? hoy : membresia.fechaFin
  const fechaFin = sumarDiasIso(base, duracionDias)
  return { ...membresia, fechaFin, estado: calcularEstado(fechaFin) }
}

export function sinCongelar(membresias: readonly Membresia[]): readonly Membresia[] {
  return membresias.filter((membresia) => !esCongelada(membresia))
}
