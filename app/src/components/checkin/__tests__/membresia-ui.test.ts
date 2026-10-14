import { describe, expect, it } from 'vitest'
import {
  clasesEstado,
  estadoDeSocio,
  etiquetaEstado,
  membresiaDeSocio,
  planDeSocio,
  textoVencimiento,
} from '../membresia-ui'
import type { Socio } from '@/mocks/types'

function isoEn(diasDesdeHoy: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() + diasDesdeHoy)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function socioConId(id: string): Socio {
  return {
    id,
    codigo: 'MS-999',
    nombre: 'Socio de Prueba',
    dni: '12345678',
    telefono: '999 999 999',
    planId: 'plan-mensual',
    estado: 'activo',
    fechaRegistro: isoEn(-30),
  }
}

function fechaFinDe(socioId: string): string {
  const membresia = membresiaDeSocio(socioId)
  if (!membresia) throw new Error(`sin membresía seed para ${socioId}`)
  return membresia.fechaFin
}

describe('textoVencimiento', () => {
  it('hoy: "Vence hoy" (nunca "en 0 días")', () => {
    expect(textoVencimiento(isoEn(0))).toBe('Vence hoy')
  })

  it('mañana: "Vence mañana" con acento', () => {
    expect(textoVencimiento(isoEn(1))).toBe('Vence mañana')
  })

  it('plural correcto a partir de 2 días', () => {
    expect(textoVencimiento(isoEn(2))).toBe('Vence en 2 días')
    expect(textoVencimiento(isoEn(24))).toBe('Vence en 24 días')
  })

  it('vencida hace 1: singular "día"', () => {
    expect(textoVencimiento(isoEn(-1))).toBe('Vencida hace 1 día')
  })

  it('vencida hace N: plural', () => {
    expect(textoVencimiento(isoEn(-9))).toBe('Vencida hace 9 días')
  })

  it('resuelve la fecha vía el join membresiasMock por socioId (soc-12 venció hace 2 días)', () => {
    expect(textoVencimiento(fechaFinDe('soc-12'))).toBe('Vencida hace 2 días')
  })
})

describe('estadoDeSocio (umbral unificado: por-vencer hasta 7 días)', () => {
  it('vencida: soc-04 (6 días vencida) y soc-12 (2 días)', () => {
    expect(estadoDeSocio(socioConId('soc-04'))).toBe('vencida')
    expect(estadoDeSocio(socioConId('soc-12'))).toBe('vencida')
  })

  it('por-vencer: soc-10 está en el borde exacto de 7 días', () => {
    expect(estadoDeSocio(socioConId('soc-10'))).toBe('por-vencer')
    expect(estadoDeSocio(socioConId('soc-05'))).toBe('por-vencer')
  })

  it('vigente: soc-01 (12 días)', () => {
    expect(estadoDeSocio(socioConId('soc-01'))).toBe('vigente')
  })

  it('socio sin membresía registrada se trata como vencida', () => {
    expect(estadoDeSocio(socioConId('soc-inexistente'))).toBe('vencida')
  })
})

describe('planDeSocio', () => {
  it('resuelve plan y precio vía la membresía del socio', () => {
    const plan = planDeSocio('soc-01')
    expect(plan?.nombre).toBe('Mensual')
    expect(plan?.precio).toBe(80)
  })

  it('plan estudiante', () => {
    const plan = planDeSocio('soc-09')
    expect(plan?.nombre).toBe('Estudiante')
    expect(plan?.precio).toBe(55)
  })

  it('socio desconocido: undefined', () => {
    expect(planDeSocio('soc-inexistente')).toBeUndefined()
  })
})

describe('etiquetas y clases de estado', () => {
  it('usan las claves del estado unificado', () => {
    expect(Object.keys(etiquetaEstado).sort()).toEqual([
      'por-vencer',
      'vencida',
      'vigente',
    ])
    expect(Object.keys(clasesEstado).sort()).toEqual([
      'por-vencer',
      'vencida',
      'vigente',
    ])
  })

  it('vencida advierte acceso bloqueado', () => {
    expect(etiquetaEstado.vencida).toContain('bloqueado')
  })

  it('etiquetas en español', () => {
    expect(etiquetaEstado.vigente).toBe('Acceso OK')
    expect(etiquetaEstado['por-vencer']).toBe('Por vencer')
  })
})
