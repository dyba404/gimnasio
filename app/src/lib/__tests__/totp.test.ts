import { describe, expect, it } from 'vitest'
import {
  PERIODO_TOTP,
  derivarSecret,
  epochActual,
  generarToken,
  segundosRestantes,
  verificarToken,
} from '../totp'
import type { Socio } from '@/mocks/types'

const EPOCH_BASE = 1_770_000_000

function socioCon(codigo: string): Socio {
  return {
    id: `socio-${codigo}`,
    codigo,
    nombre: 'Socio de prueba',
    dni: '45782136',
    telefono: '999876543',
    planId: 'plan-mensual',
    estado: 'activo',
    fechaRegistro: '2026-01-01',
  }
}

describe('derivarSecret', () => {
  it('es determinista: mismo código produce el mismo secret', () => {
    expect(derivarSecret('MS-001')).toBe(derivarSecret('MS-001'))
  })

  it('códigos distintos producen secrets distintos', () => {
    expect(derivarSecret('MS-001')).not.toBe(derivarSecret('MS-002'))
  })

  it('produce base32 válida de 32 caracteres (160 bits)', () => {
    expect(derivarSecret('MS-001')).toMatch(/^[A-Z2-7]{32}$/)
  })
})

describe('generarToken', () => {
  const socio = socioCon('MS-001')

  it('es determinista dentro del mismo período de 30s', () => {
    const alInicio = generarToken(socio, EPOCH_BASE)
    const alFinal = generarToken(socio, EPOCH_BASE + PERIODO_TOTP - 1)
    expect(alInicio).toBe(alFinal)
  })

  it('períodos distintos producen tokens distintos', () => {
    const actual = generarToken(socio, EPOCH_BASE)
    const siguiente = generarToken(socio, EPOCH_BASE + PERIODO_TOTP)
    expect(actual).not.toBe(siguiente)
  })

  it('el formato es de 6 dígitos', () => {
    expect(generarToken(socio, EPOCH_BASE)).toMatch(/^\d{6}$/)
  })

  it('socios distintos obtienen tokens distintos en el mismo período', () => {
    const otro = socioCon('MS-002')
    expect(generarToken(socio, EPOCH_BASE)).not.toBe(
      generarToken(otro, EPOCH_BASE),
    )
  })
})

describe('verificarToken', () => {
  const socio = socioCon('MS-001')
  const token = generarToken(socio, EPOCH_BASE)

  it('acepta el token del período actual', () => {
    expect(verificarToken(socio, token, EPOCH_BASE + 10)).toBe(true)
  })

  it('tolera el período inmediato anterior y siguiente (window 1)', () => {
    expect(verificarToken(socio, token, EPOCH_BASE - PERIODO_TOTP + 10)).toBe(true)
    expect(verificarToken(socio, token, EPOCH_BASE + PERIODO_TOTP + 10)).toBe(true)
  })

  it('rechaza tokens de 2+ períodos de distancia', () => {
    expect(verificarToken(socio, token, EPOCH_BASE + 2 * PERIODO_TOTP + 10)).toBe(
      false,
    )
  })

  it('rechaza el token de otro socio', () => {
    const otro = socioCon('MS-002')
    const tokenOtro = generarToken(otro, EPOCH_BASE)
    expect(verificarToken(socio, tokenOtro, EPOCH_BASE + 10)).toBe(false)
  })

  it('rechaza un token incorrecto', () => {
    const incorrecto = token === '000000' ? '999999' : '000000'
    expect(verificarToken(socio, incorrecto, EPOCH_BASE + 10)).toBe(false)
  })
})

describe('segundosRestantes', () => {
  it('está en rango 1-30', () => {
    const restantes = segundosRestantes()
    expect(restantes).toBeGreaterThanOrEqual(1)
    expect(restantes).toBeLessThanOrEqual(30)
  })
})

describe('epochActual', () => {
  it('devuelve segundos Unix (coherente con Date.now)', () => {
    const antes = Math.floor(Date.now() / 1000)
    const epoch = epochActual()
    const despues = Math.floor(Date.now() / 1000)
    expect(epoch).toBeGreaterThanOrEqual(antes)
    expect(epoch).toBeLessThanOrEqual(despues)
  })
})
